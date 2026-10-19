import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ─── Constantes motifs ────────────────────────────────────────────────────────
export const DELETION_REASONS = [
  { value: "trop_cher",          label: "Trop cher" },
  { value: "plus_besoin",        label: "Je n'en ai plus besoin" },
  { value: "autre_outil",        label: "Je passe a un autre outil" },
  { value: "probleme_technique", label: "Probleme technique" },
  { value: "autre",              label: "Autre" },
] as const;

export type DeletionReason = typeof DELETION_REASONS[number]["value"];

// ─── Merchant : creer une demande ────────────────────────────────────────────
export const requestAccountDeletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z.object({
      reason:       z.enum(["trop_cher", "plus_besoin", "autre_outil", "probleme_technique", "autre"]),
      reason_other: z.string().optional(),
      comment:      z.string().optional(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: reqId, error } = await (supabase as any).rpc("request_account_deletion", {
      p_reason:       data.reason,
      p_reason_other: data.reason_other ?? null,
      p_comment:      data.comment ?? null,
    });
    if (error) throw new Error(error.message);

    // Envoyer email de confirmation (non bloquant)
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: userRecord } = await supabaseAdmin.auth.admin.getUserById(userId);
      const { data: shopRecord } = await supabaseAdmin.from("shops").select("name").eq("owner_id", userId).maybeSingle();
      const email     = userRecord?.user?.email ?? "";
      const fullName  = userRecord?.user?.user_metadata?.full_name ?? "Cher commercant";
      const shopName  = (shopRecord as any)?.name ?? "";

      if (email) {
        const { sendDeletionRequestEmail } = await import("@/lib/account-deletion-email.server");
        await sendDeletionRequestEmail({ email, fullName, shopName });
      }
    } catch (emailErr) {
      console.warn("[requestAccountDeletion] Email non bloquant:", emailErr);
    }

    return { ok: true, requestId: reqId };
  });

// ─── Merchant : annuler sa demande pending ───────────────────────────────────
export const cancelAccountDeletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { error } = await (supabase as any).rpc("cancel_account_deletion_request");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Merchant : lire sa propre demande active ────────────────────────────────
export const getMyDeletionRequest = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("account_deletion_requests")
      .select("id, status, requested_at, scheduled_deletion_at, cancelled_at")
      .eq("user_id", userId)
      .in("status", ["pending", "processed"])
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? null;
  });

// ─── Admin : liste toutes les demandes ───────────────────────────────────────
export const adminListDeletionRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z.object({
      statusFilter: z.string().optional(),
    }).parse(d ?? {})
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await (supabase as any).rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acces refuse");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("account_deletion_requests")
      .select(`
        id, user_id, shop_id, reason, reason_other, comment, status,
        requested_at, processed_at, processed_by, scheduled_deletion_at,
        cancelled_at, restored_at, completed_at, admin_note,
        shops:shop_id ( name, plan_id, created_at )
      `)
      .order("requested_at", { ascending: false });

    if (data.statusFilter && data.statusFilter !== "all") {
      if (data.statusFilter === "terminal") {
        query = query.in("status", ["cancelled", "restored", "completed"]);
      } else {
        query = query.eq("status", data.statusFilter);
      }
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    // Enrichir avec les infos utilisateur
    const enriched = await Promise.all((rows ?? []).map(async (row: any) => {
      let merchantEmail = "";
      let merchantName  = "";
      let productCount  = 0;

      try {
        const [{ data: userRec }, { count }] = await Promise.all([
          supabaseAdmin.auth.admin.getUserById(row.user_id),
          supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("shop_id", row.shop_id ?? ""),
        ]);
        merchantEmail = userRec?.user?.email ?? "";
        merchantName  = userRec?.user?.user_metadata?.full_name ?? "";
        productCount  = count ?? 0;
      } catch { /* continue */ }

      return { ...row, merchantEmail, merchantName, productCount };
    }));

    return enriched;
  });

// ─── Admin : traiter une demande (suspension) ────────────────────────────────
export const adminProcessDeletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z.object({
      requestId:         z.string().uuid(),
      scheduledDeletion: z.string(),          // ISO datetime
      adminNote:         z.string().optional(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await (supabase as any).rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acces refuse");

    const { error } = await (supabase as any).rpc("admin_process_deletion_request", {
      p_request_id:         data.requestId,
      p_scheduled_deletion: data.scheduledDeletion,
      p_admin_note:         data.adminNote ?? null,
    });
    if (error) throw new Error(error.message);

    // Email au commerçant (non bloquant)
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: req } = await supabaseAdmin
        .from("account_deletion_requests")
        .select("user_id, scheduled_deletion_at")
        .eq("id", data.requestId)
        .single();
      if (req) {
        const { data: userRec } = await supabaseAdmin.auth.admin.getUserById((req as any).user_id);
        const { data: shopRec } = await supabaseAdmin.from("shops").select("name").eq("owner_id", (req as any).user_id).maybeSingle();
        const email    = userRec?.user?.email ?? "";
        const fullName = userRec?.user?.user_metadata?.full_name ?? "";
        const shopName = (shopRec as any)?.name ?? "";
        const deletionDate = new Date((req as any).scheduled_deletion_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
        if (email) {
          const { sendDeletionProcessedEmail } = await import("@/lib/account-deletion-email.server");
          await sendDeletionProcessedEmail({ email, fullName, shopName, deletionDate });
        }
      }
    } catch (emailErr) {
      console.warn("[adminProcessDeletion] Email non bloquant:", emailErr);
    }

    return { ok: true };
  });

// ─── Admin : restaurer un compte ─────────────────────────────────────────────
export const adminRestoreAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z.object({
      requestId: z.string().uuid(),
      adminNote: z.string().optional(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await (supabase as any).rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acces refuse");

    const { error } = await (supabase as any).rpc("admin_restore_account", {
      p_request_id: data.requestId,
      p_admin_note: data.adminNote ?? null,
    });
    if (error) throw new Error(error.message);

    // Email restauration (non bloquant)
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: req } = await supabaseAdmin
        .from("account_deletion_requests")
        .select("user_id")
        .eq("id", data.requestId)
        .single();
      if (req) {
        const { data: userRec } = await supabaseAdmin.auth.admin.getUserById((req as any).user_id);
        const { data: shopRec } = await supabaseAdmin.from("shops").select("name").eq("owner_id", (req as any).user_id).maybeSingle();
        const email    = userRec?.user?.email ?? "";
        const fullName = userRec?.user?.user_metadata?.full_name ?? "";
        const shopName = (shopRec as any)?.name ?? "";
        if (email) {
          const { sendDeletionRestoredEmail } = await import("@/lib/account-deletion-email.server");
          await sendDeletionRestoredEmail({ email, fullName, shopName });
        }
      }
    } catch (emailErr) {
      console.warn("[adminRestoreAccount] Email non bloquant:", emailErr);
    }

    return { ok: true };
  });

// ─── Admin : modifier la date de suppression ─────────────────────────────────
export const adminUpdateDeletionDate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z.object({
      requestId:       z.string().uuid(),
      newScheduledDate: z.string(),
      adminNote:       z.string().optional(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await (supabase as any).rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acces refuse");

    const { error } = await (supabase as any).rpc("admin_update_deletion_date", {
      p_request_id:         data.requestId,
      p_new_scheduled_date: data.newScheduledDate,
      p_admin_note:         data.adminNote ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
