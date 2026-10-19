import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Route cron : /api/cron/process-account-deletions
// Cadence recommandee : toutes les 10 minutes
// Authentification via Bearer CRON_SECRET.
//
// 1. Rappel J-7 : pour chaque demande status=processed dont reminder_sent_at est null
//    et dont la date de suppression est dans 7 jours ou moins, envoie un email de rappel.
// 2. Suppression definitive : pour chaque demande status=processed dont scheduled_deletion_at <= now(),
//    declenche la suppression definitive via la fonction PL/pgSQL perform_account_final_deletion
//    et envoie un email de confirmation au commercant.

async function handleCron({ request }: { request: Request }) {
  // 1. Authentifier
  const authError = await authenticateCronRequest(request);
  if (authError) return authError;

  const now = new Date();
  const nowIso = now.toISOString();

  // ─────────────────────────────────────────────────────────────────────────
  // A. RAPPELS J-7
  // ─────────────────────────────────────────────────────────────────────────
  let remindersSent = 0;
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: reminderCandidates, error: reminderError } = await supabaseAdmin
    .from("account_deletion_requests")
    .select("id, user_id, shop_id, scheduled_deletion_at")
    .eq("status", "processed")
    .is("reminder_sent_at", null)
    .gt("scheduled_deletion_at", nowIso)
    .lte("scheduled_deletion_at", inSevenDays);

  if (reminderError) {
    console.error("[CronDeletion] Erreur lecture rappels J-7:", reminderError.message);
  } else if (reminderCandidates?.length) {
    for (const req of reminderCandidates) {
      try {
        let merchantEmail = "";
        let merchantName = "";
        let shopName = "";

        const [{ data: userRec }, { data: shopRec }] = await Promise.all([
          supabaseAdmin.auth.admin.getUserById(req.user_id),
          req.shop_id
            ? supabaseAdmin.from("shops").select("name").eq("id", req.shop_id).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        merchantEmail = userRec?.user?.email ?? "";
        merchantName = userRec?.user?.user_metadata?.full_name ?? "";
        shopName = (shopRec as any)?.name ?? "";

        if (merchantEmail && req.scheduled_deletion_at) {
          const deletionDate = new Date(req.scheduled_deletion_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });

          const { sendDeletionReminderEmail } = await import("@/lib/account-deletion-email.server");
          await sendDeletionReminderEmail({
            email: merchantEmail,
            fullName: merchantName,
            shopName,
            deletionDate,
          });

          await supabaseAdmin
            .from("account_deletion_requests")
            .update({ reminder_sent_at: nowIso })
            .eq("id", req.id);

          await supabaseAdmin.from("account_deletion_audit").insert({
            request_id: req.id,
            action: "reminder_sent",
            actor_id: null,
            details: { scheduled_deletion_at: req.scheduled_deletion_at, sent_to: merchantEmail },
          });

          remindersSent++;
          console.log(`[CronDeletion] Rappel J-7 envoye a ${merchantEmail} (req=${req.id})`);
        }
      } catch (err: any) {
        console.error(`[CronDeletion] Erreur envoi rappel J-7 (req=${req.id}):`, err?.message);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // B. SUPPRESSIONS DEFINITIVES
  // ─────────────────────────────────────────────────────────────────────────
  const { data: due, error: fetchError } = await supabaseAdmin
    .from("account_deletion_requests")
    .select("id, user_id, shop_id, scheduled_deletion_at")
    .eq("status", "processed")
    .lte("scheduled_deletion_at", nowIso);

  if (fetchError) {
    console.error("[CronDeletion] Erreur lecture demandes:", fetchError.message);
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
  }

  if (!due?.length) {
    console.log(`[CronDeletion] Aucune suppression a executer (${remindersSent} rappel(s) envoye(s)).`);
    return new Response(JSON.stringify({ processed: 0, skipped: 0, remindersSent }), { status: 200 });
  }

  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const req of due) {
    try {
      // Recuperer les informations avant suppression pour l'email de confirmation
      let merchantEmail = "";
      let merchantName = "";
      let shopName = "";

      try {
        const [{ data: userRec }, { data: shopRec }] = await Promise.all([
          supabaseAdmin.auth.admin.getUserById(req.user_id),
          req.shop_id
            ? supabaseAdmin.from("shops").select("name").eq("id", req.shop_id).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        merchantEmail = userRec?.user?.email ?? "";
        merchantName = userRec?.user?.user_metadata?.full_name ?? "";
        shopName = (shopRec as any)?.name ?? "";
      } catch (lookupErr) {
        console.warn("[CronDeletion] Impossible de lire les infos commercant avant suppression:", lookupErr);
      }

      // Executer la suppression definitive via la fonction PL/pgSQL
      const { data: result, error: deletionError } = await (supabaseAdmin as any)
        .rpc("perform_account_final_deletion", { p_request_id: req.id });

      if (deletionError) {
        console.error(`[CronDeletion] Erreur suppression ${req.id}:`, deletionError.message);
        errors.push(req.id);
        skipped++;
        continue;
      }

      if (result?.skipped) {
        console.log(`[CronDeletion] Ignore ${req.id}: ${result.reason}`);
        skipped++;
        continue;
      }

      if (result?.error) {
        console.error(`[CronDeletion] Erreur logique ${req.id}:`, result.error);
        errors.push(req.id);
        skipped++;
        continue;
      }

      // Envoyer l'email de confirmation (non bloquant, apres la suppression)
      if (merchantEmail) {
        try {
          const { sendDeletionCompletedEmail } = await import("@/lib/account-deletion-email.server");
          await sendDeletionCompletedEmail({ email: merchantEmail, fullName: merchantName, shopName });
        } catch (emailErr) {
          console.warn("[CronDeletion] Email non bloquant:", emailErr);
        }
      }

      console.log(`[CronDeletion] Compte supprime: user_id=${req.user_id} shop_id=${req.shop_id}`);
      processed++;
    } catch (err: any) {
      console.error(`[CronDeletion] Exception inattendue pour ${req.id}:`, err?.message);
      errors.push(req.id);
      skipped++;
    }
  }

  console.log(`[CronDeletion] Termine: ${processed} supprime(s), ${skipped} ignore(s), ${remindersSent} rappel(s), ${errors.length} erreur(s).`);
  return new Response(
    JSON.stringify({ success: true, processed, skipped, remindersSent, errors, processedAt: nowIso }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

export const Route = createFileRoute("/api/cron/process-account-deletions")({
  server: {
    handlers: {
      GET: handleCron,
      POST: handleCron,
    },
  },
});
