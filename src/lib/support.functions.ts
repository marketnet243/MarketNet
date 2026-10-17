import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin as rawSupabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  sendNewTicketAdminNotification,
  sendAdminReplyNotification,
  sendBroadcastEmailNotification,
} from "@/lib/support-email.server";

// Cast pour les tables de la migration support
const supabaseAdmin = rawSupabaseAdmin as any;

// ─── Types ─────────────────────────────────────────────────────────────────

export type SupportTicketCategorie =
  | "paiement_abonnement"
  | "boutique_produits"
  | "commandes"
  | "autre";

export type SupportTicketStatut = "ouvert" | "en_cours" | "résolu" | "fermé";

export interface SupportTicket {
  id: string;
  numero: string;
  shop_id: string;
  merchant_id: string;
  titre: string;
  categorie: SupportTicketCategorie;
  contact_email: string | null;
  contact_whatsapp: string | null;
  statut: SupportTicketStatut;
  cree_le: string;
  mis_a_jour_le: string;
  dernier_message_le: string | null;
  shops?: { name: string; slug: string; whatsapp: string | null } | null;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  auteur: "merchant" | "admin";
  texte: string;
  note_interne: boolean;
  cree_le: string;
  lu_le: string | null;
  support_attachments?: { id: string; chemin: string; mime_type: string; taille: number }[];
}

export interface SupportBroadcast {
  id: string;
  admin_id: string;
  titre: string;
  message: string;
  cible: "tous" | "selection";
  destinataires_count: number;
  envoyes_count: number;
  echoues_count: number;
  lus_count: number;
  statut: string;
  cree_le: string;
}

export interface SupportBroadcastItem {
  id: string;
  titre: string;
  message: string;
  cree_le: string;
  lu_le: string | null;
}

export interface CandidateMerchant {
  id: string;
  email: string;
  full_name: string | null;
  shop_id: string;
  shop_name: string;
  shop_slug: string;
  plan_id: string;
}

// ─── 1. Créer un ticket ────────────────────────────────────────────────────

export const createSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: {
    titre: string;
    categorie: SupportTicketCategorie;
    texte: string;
    contact_email?: string;
    contact_whatsapp?: string;
    attachment_paths?: { chemin: string; mime_type: string; taille: number }[];
  }) => d)
  .handler(async ({ data, context }) => {
    const sb = supabaseAdmin;
    const userId = (context as any).userId;

    // Récupérer la boutique du commerçant
    const { data: shop } = await sb
      .from("shops")
      .select("id, name, slug, whatsapp")
      .eq("owner_id", userId)
      .maybeSingle();

    if (!shop) throw new Error("Boutique introuvable. Créez d'abord votre boutique.");

    // Valider les pièces jointes (max 3, types acceptés, taille)
    const attachments = (data.attachment_paths ?? []).slice(0, 3);
    const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
    for (const att of attachments) {
      if (!ALLOWED.includes(att.mime_type)) throw new Error("Type de fichier non autorisé.");
      if (att.taille > 5 * 1024 * 1024) throw new Error("Fichier trop volumineux (max 5 Mo).");
    }

    // Créer le ticket
    const { data: ticket, error: tErr } = await sb
      .from("support_tickets")
      .insert({
        shop_id: shop.id,
        merchant_id: userId,
        titre: data.titre.trim(),
        categorie: data.categorie,
        contact_email: data.contact_email?.trim() || null,
        contact_whatsapp: data.contact_whatsapp?.trim() || null,
        statut: "ouvert",
      })
      .select()
      .single();

    if (tErr || !ticket) throw new Error(tErr?.message ?? "Erreur création ticket.");

    // Créer le message initial
    const { data: msg, error: mErr } = await sb
      .from("support_messages")
      .insert({
        ticket_id: ticket.id,
        auteur: "merchant",
        texte: data.texte.trim(),
        note_interne: false,
      })
      .select()
      .single();

    if (mErr || !msg) throw new Error(mErr?.message ?? "Erreur création message.");

    // Enregistrer les pièces jointes
    if (attachments.length > 0) {
      await sb.from("support_attachments").insert(
        attachments.map((a: any) => ({
          message_id: msg.id,
          chemin: a.chemin,
          mime_type: a.mime_type,
          taille: a.taille,
        }))
      );
    }

    // Récupérer email du commerçant pour notification — best-effort
    try {
      const { data: userRecord } = await sb.auth.admin.getUserById(userId);
      const merchantEmail = userRecord?.user?.email ?? "";
      // Notifier l'admin — ne bloque pas si ça échoue
      sendNewTicketAdminNotification({
        ticketId: ticket.id,
        numero: ticket.numero,
        titre: ticket.titre,
        categorie: ticket.categorie,
        boutique: shop.name,
        email: data.contact_email || merchantEmail,
        whatsapp: data.contact_whatsapp || shop.whatsapp || undefined,
        texteMessage: data.texte.trim(),
      }).catch((e) => console.warn("[Support] Erreur notif admin:", e));
    } catch (e) {
      console.warn("[Support] Impossible d'envoyer notif admin:", e);
    }

    return { success: true, ticket };
  });

// ─── 2. Lister les tickets (commerçant) ───────────────────────────────────

export const listMyTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("support_tickets")
      .select("*")
      .eq("merchant_id", (context as any).userId)
      .order("cree_le", { ascending: false });
    if (error) throw new Error(error.message);

    // Compter les réponses non lues (messages admin non lus depuis la dernière visite du commerçant)
    const ticketsWithUnread = await Promise.all(
      (data ?? []).map(async (t: any) => {
        const { count } = await supabaseAdmin
          .from("support_messages")
          .select("*", { count: "exact", head: true })
          .eq("ticket_id", t.id)
          .eq("auteur", "admin")
          .eq("note_interne", false)
          .is("lu_le", null);
        return { ...t, unread_count: count ?? 0 };
      })
    );

    return ticketsWithUnread as (SupportTicket & { unread_count: number })[];
  });

// ─── 3. Détail ticket + messages (commerçant) ─────────────────────────────

export const getTicketDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { ticket_id: string }) => d)
  .handler(async ({ data, context }) => {
    const sb = supabaseAdmin;
    const userId = (context as any).userId;

    const { data: ticket, error } = await sb
      .from("support_tickets")
      .select("*, shops(name, slug, whatsapp)")
      .eq("id", data.ticket_id)
      .single();

    if (error || !ticket) throw new Error("Ticket introuvable.");

    // Vérifier accès
    const isOwner = ticket.merchant_id === userId;
    const { data: isAdminData } = await sb.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isOwner && !isAdminData) throw new Error("Accès interdit.");

    // Récupérer les vraies coordonnées du commerçant pour l'admin
    let merchant_email: string | null = ticket.contact_email || null;
    let merchant_whatsapp: string | null = ticket.contact_whatsapp || null;
    if (isAdminData) {
      const shop = (ticket as any).shops;
      // WhatsApp : priorité shop.whatsapp
      if (shop?.whatsapp) {
        merchant_whatsapp = shop.whatsapp;
      }
      // Email : depuis auth si pas déjà renseigné
      if (!merchant_email) {
        try {
          const { data: authUser } = await sb.auth.admin.getUserById(ticket.merchant_id);
          merchant_email = authUser?.user?.email ?? null;
        } catch {}
      }
    }

    // Messages (sans notes internes pour le commercant)
    const { data: messages } = await sb
      .from("support_messages")
      .select("*, support_attachments(id, chemin, mime_type, taille)")
      .eq("ticket_id", data.ticket_id)
      .order("cree_le", { ascending: true });

    const filteredMessages = (messages ?? []).filter(
      (m: any) => isAdminData || !m.note_interne
    );

    // Marquer les messages admin comme lus pour le commercant
    if (isOwner) {
      const unreadIds = (messages ?? [])
        .filter((m: any) => m.auteur === "admin" && !m.lu_le && !m.note_interne)
        .map((m: any) => m.id);
      if (unreadIds.length > 0) {
        await sb
          .from("support_messages")
          .update({ lu_le: new Date().toISOString() })
          .in("id", unreadIds);
      }
    }

    // Marquer les messages commerçant comme lus pour l'administrateur
    if (isAdminData) {
      const unreadMerchantIds = (messages ?? [])
        .filter((m: any) => m.auteur === "merchant" && !m.lu_le)
        .map((m: any) => m.id);
      if (unreadMerchantIds.length > 0) {
        await sb
          .from("support_messages")
          .update({ lu_le: new Date().toISOString() })
          .in("id", unreadMerchantIds);
      }
    }

    return {
      ticket: ticket as SupportTicket,
      messages: filteredMessages as SupportMessage[],
      merchant_email,
      merchant_whatsapp,
    };
  });

// ─── 4. Répondre à un ticket (commerçant ou admin) ────────────────────────

export const replyToTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: {
    ticket_id: string;
    texte: string;
    note_interne?: boolean;
    attachment_paths?: { chemin: string; mime_type: string; taille: number }[];
  }) => d)
  .handler(async ({ data, context }) => {
    const sb = supabaseAdmin;
    const userId = (context as any).userId;

    const { data: isAdminData } = await sb.rpc("has_role", { _user_id: userId, _role: "admin" });

    // Vérifier que le ticket appartient au commerçant si ce n'est pas l'admin
    const { data: ticket } = await sb
      .from("support_tickets")
      .select("*, shops(name), merchant_id, contact_email, numero, titre")
      .eq("id", data.ticket_id)
      .single();

    if (!ticket) throw new Error("Ticket introuvable.");
    if (!isAdminData && ticket.merchant_id !== userId) throw new Error("Accès interdit.");

    const auteur: "merchant" | "admin" = isAdminData ? "admin" : "merchant";
    const note_interne = isAdminData ? (data.note_interne ?? false) : false;

    // Pièces jointes
    const attachments = (data.attachment_paths ?? []).slice(0, 3);
    const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
    for (const att of attachments) {
      if (!ALLOWED.includes(att.mime_type)) throw new Error("Type de fichier non autorisé.");
      if (att.taille > 5 * 1024 * 1024) throw new Error("Fichier trop volumineux (max 5 Mo).");
    }

    const { data: msg, error: mErr } = await sb
      .from("support_messages")
      .insert({
        ticket_id: data.ticket_id,
        auteur,
        texte: data.texte.trim(),
        note_interne,
      })
      .select()
      .single();

    if (mErr || !msg) throw new Error(mErr?.message ?? "Erreur envoi réponse.");

    if (attachments.length > 0) {
      await sb.from("support_attachments").insert(
        attachments.map((a: any) => ({
          message_id: msg.id,
          chemin: a.chemin,
          mime_type: a.mime_type,
          taille: a.taille,
        }))
      );
    }

    // Notification par e-mail — best-effort
    if (isAdminData && !note_interne && ticket.contact_email) {
      try {
        const { data: merchantUser } = await sb.auth.admin.getUserById(ticket.merchant_id);
        const merchantName = merchantUser?.user?.user_metadata?.full_name || "Commerçant";
        sendAdminReplyNotification({
          ticketId: ticket.id,
          numero: (ticket as any).numero,
          titre: ticket.titre,
          texteReponse: data.texte.trim(),
          merchantName,
          merchantEmail: ticket.contact_email,
        }).catch((e) => console.warn("[Support] Erreur notif commerçant:", e));
      } catch (e) {
        console.warn("[Support] Impossible d'envoyer notif commerçant:", e);
      }
    } else if (isAdminData && !note_interne) {
      // Essayer avec l'email auth si contact_email absent
      try {
        const { data: merchantUser } = await sb.auth.admin.getUserById(ticket.merchant_id);
        if (merchantUser?.user?.email) {
          const merchantName = merchantUser.user.user_metadata?.full_name || "Commerçant";
          sendAdminReplyNotification({
            ticketId: ticket.id,
            numero: (ticket as any).numero,
            titre: ticket.titre,
            texteReponse: data.texte.trim(),
            merchantName,
            merchantEmail: merchantUser.user.email,
          }).catch((e) => console.warn("[Support] Erreur notif commerçant:", e));
        }
      } catch (e) {
        console.warn("[Support] Impossible d'envoyer notif commerçant:", e);
      }
    }

    return { success: true, message: msg };
  });

// ─── 5. Changer le statut d'un ticket (admin) ─────────────────────────────

export const updateTicketStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { ticket_id: string; statut: SupportTicketStatut }) => d)
  .handler(async ({ data, context }) => {
    const sb = supabaseAdmin;
    const { data: isAdminData } = await sb.rpc("has_role", { _user_id: (context as any).userId, _role: "admin" });
    if (!isAdminData) throw new Error("Accès réservé à l'administrateur.");

    const { error } = await sb
      .from("support_tickets")
      .update({ statut: data.statut })
      .eq("id", data.ticket_id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── 6. Lister tous les tickets (admin) ───────────────────────────────────

export const adminListTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: {
    statut?: SupportTicketStatut | "tous";
    categorie?: SupportTicketCategorie | "tous";
    search?: string;
    page?: number;
  }) => d)
  .handler(async ({ data, context }) => {
    const sb = supabaseAdmin;
    const { data: isAdminData } = await sb.rpc("has_role", { _user_id: (context as any).userId, _role: "admin" });
    if (!isAdminData) throw new Error("Accès réservé à l'administrateur.");

    let query = sb
      .from("support_tickets")
      .select("*, shops(name, slug, whatsapp, plan_id)", { count: "exact" })
      .order("dernier_message_le", { ascending: true, nullsFirst: true });

    if (data.statut && data.statut !== "tous") query = query.eq("statut", data.statut);
    if (data.categorie && data.categorie !== "tous") query = query.eq("categorie", data.categorie);
    if (data.search?.trim()) {
      const s = data.search.trim();
      query = query.or(`numero.ilike.%${s}%,titre.ilike.%${s}%`);
    }

    const page = data.page ?? 1;
    const perPage = 30;
    query = query.range((page - 1) * perPage, page * perPage - 1);

    const { data: tickets, count, error } = await query;
    if (error) throw new Error(error.message);

    // Compter messages non lus pour chaque ticket
    const withUnread = await Promise.all(
      (tickets ?? []).map(async (t: any) => {
        const { count: c } = await sb
          .from("support_messages")
          .select("*", { count: "exact", head: true })
          .eq("ticket_id", t.id)
          .eq("auteur", "merchant")
          .is("lu_le", null);
        return { ...t, unread_count: c ?? 0 };
      })
    );

    return { tickets: withUnread as unknown as (SupportTicket & { unread_count: number })[], total: count ?? 0 };
  });

// ─── 7. Compteur de messages commerçants non lus (admin, pour badge) ─────

export const adminPendingTicketsCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = supabaseAdmin;
    const { data: isAdminData } = await sb.rpc("has_role", { _user_id: (context as any).userId, _role: "admin" });
    if (!isAdminData) return { count: 0 };

    // Compter les messages commerçants non lus par l'administrateur
    const { count } = await sb
      .from("support_messages")
      .select("*", { count: "exact", head: true })
      .eq("auteur", "merchant")
      .is("lu_le", null);

    return { count: count ?? 0 };
  });

// ─── 8. Générer une URL signée pour une pièce jointe ──────────────────────

export const getAttachmentSignedUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { chemin: string }) => d)
  .handler(async ({ data, context }) => {
    const sb = supabaseAdmin;
    const userId = (context as any).userId;

    // Vérifier accès : admin → toujours autorisé
    // Commerçant → autoriser si la pièce jointe est liée à un ticket qui lui appartient
    const { data: isAdminData } = await sb.rpc("has_role", { _user_id: userId, _role: "admin" });

    if (!isAdminData) {
      // Vérifier que cette pièce jointe appartient à un ticket du commerçant
      const { data: attachment } = await sb
        .from("support_attachments")
        .select("id, support_messages(ticket_id, support_tickets(merchant_id))")
        .eq("chemin", data.chemin)
        .maybeSingle();

      const merchantId = (attachment as any)
        ?.support_messages?.support_tickets?.merchant_id;

      if (!attachment || merchantId !== userId) {
        throw new Error("Accès interdit.");
      }
    }

    const { data: signed, error } = await sb.storage
      .from("support-attachments")
      .createSignedUrl(data.chemin, 3600); // expire après 1h

    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

// ─── 9. Compteur support non lu pour le commerçant (badge menu) ──────────

export const myUnreadSupportCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = supabaseAdmin;
    const userId = (context as any).userId;

    // 1. Messages tickets admin non lus par le commerçant
    let ticketUnread = 0;
    const { data: tickets } = await sb
      .from("support_tickets")
      .select("id")
      .eq("merchant_id", userId);

    if (tickets?.length) {
      const ids = tickets.map((t: any) => t.id);
      const { count } = await sb
        .from("support_messages")
        .select("*", { count: "exact", head: true })
        .in("ticket_id", ids)
        .eq("auteur", "admin")
        .eq("note_interne", false)
        .is("lu_le", null);
      ticketUnread = count ?? 0;
    }

    // 2. Diffusions (annonces) non lues par le commerçant
    const { count: broadcastUnread } = await sb
      .from("support_broadcast_recipients")
      .select("*", { count: "exact", head: true })
      .eq("merchant_id", userId)
      .is("lu_le", null);

    return { count: ticketUnread + (broadcastUnread ?? 0) };
  });

// ─── 10. MODULE DIFFUSIONS (BROADCASTS) ────────────────────────────────────

export const adminListCandidateMerchants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CandidateMerchant[]> => {
    const sb = supabaseAdmin;
    const { data: isAdminData } = await sb.rpc("has_role", { _user_id: (context as any).userId, _role: "admin" });
    if (!isAdminData) throw new Error("Accès refusé");

    const { data: shops, error: shopsErr } = await sb
      .from("shops")
      .select("id, name, slug, plan_id, owner_id, is_suspended")
      .eq("is_suspended", false);

    if (shopsErr) throw new Error(shopsErr.message);

    const { data: profiles } = await sb
      .from("profiles")
      .select("id, email, full_name, status");

    const { data: adminRoles } = await sb
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminUserIds = new Set((adminRoles ?? []).map((r: any) => r.user_id));
    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    const candidates: CandidateMerchant[] = [];
    const seen = new Set<string>();

    for (const s of (shops ?? [])) {
      if (adminUserIds.has(s.owner_id)) continue;
      if (seen.has(s.owner_id)) continue;

      const prof = profileMap.get(s.owner_id);
      if (prof?.status === "suspended") continue;

      let email = prof?.email;
      if (!email || !email.includes("@")) {
        try {
          const { data: authUser } = await sb.auth.admin.getUserById(s.owner_id);
          email = authUser?.user?.email ?? "";
        } catch {}
      }
      if (!email || !email.includes("@")) continue;

      seen.add(s.owner_id);
      candidates.push({
        id: s.owner_id,
        email,
        full_name: prof?.full_name ?? null,
        shop_id: s.id,
        shop_name: s.name,
        shop_slug: s.slug,
        plan_id: s.plan_id || "free",
      });
    }

    return candidates;
  });

export const adminCreateBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: {
    titre: string;
    message: string;
    cible: "tous" | "selection";
    target_merchant_ids?: string[];
  }) => d)
  .handler(async ({ data, context }) => {
    const sb = supabaseAdmin;
    const adminId = (context as any).userId;
    const { data: isAdminData } = await sb.rpc("has_role", { _user_id: adminId, _role: "admin" });
    if (!isAdminData) throw new Error("Accès refusé");

    const titre = data.titre.trim();
    const message = data.message.trim();
    if (titre.length < 3 || titre.length > 200) {
      throw new Error("Le titre doit contenir entre 3 et 200 caractères.");
    }
    if (message.length < 5 || message.length > 10000) {
      throw new Error("Le message doit contenir entre 5 et 10 000 caractères.");
    }

    const { data: shops } = await sb
      .from("shops")
      .select("id, name, slug, plan_id, owner_id, is_suspended")
      .eq("is_suspended", false);

    const { data: profiles } = await sb
      .from("profiles")
      .select("id, email, full_name, status");

    const { data: adminRoles } = await sb
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminUserIds = new Set((adminRoles ?? []).map((r: any) => r.user_id));
    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const selectedSet = data.target_merchant_ids ? new Set(data.target_merchant_ids) : null;

    const targets: { merchant_id: string; shop_id: string; email: string }[] = [];
    const seenMerchants = new Set<string>();

    for (const s of (shops ?? [])) {
      if (adminUserIds.has(s.owner_id)) continue;
      if (seenMerchants.has(s.owner_id)) continue;
      if (selectedSet && !selectedSet.has(s.owner_id)) continue;

      const prof = profileMap.get(s.owner_id);
      if (prof?.status === "suspended") continue;

      let email = prof?.email;
      if (!email || !email.includes("@")) {
        try {
          const { data: authUser } = await sb.auth.admin.getUserById(s.owner_id);
          email = authUser?.user?.email ?? "";
        } catch {}
      }
      if (!email || !email.includes("@")) continue;

      seenMerchants.add(s.owner_id);
      targets.push({
        merchant_id: s.owner_id,
        shop_id: s.id,
        email,
      });
    }

    if (targets.length === 0) {
      throw new Error("Aucun commerçant éligible trouvé pour cette cible.");
    }

    const { data: broadcast, error: bErr } = await sb
      .from("support_broadcasts")
      .insert({
        admin_id: adminId,
        titre,
        message,
        cible: data.cible,
        destinataires_count: targets.length,
        envoyes_count: 0,
        echoues_count: 0,
        lus_count: 0,
        statut: "en_cours",
      })
      .select()
      .single();

    if (bErr || !broadcast) throw new Error(bErr?.message || "Erreur création diffusion");

    const recipientRows = targets.map((t) => ({
      broadcast_id: broadcast.id,
      merchant_id: t.merchant_id,
      shop_id: t.shop_id,
      email: t.email,
      email_statut: "en_attente",
    }));

    await sb.from("support_broadcast_recipients").insert(recipientRows);

    let dailyLimit = 200;
    try {
      const { data: setting } = await sb
        .from("app_settings")
        .select("value")
        .eq("key", "broadcast_daily_limit")
        .maybeSingle();
      if (setting?.value) {
        const parsed = Number(typeof setting.value === "string" ? setting.value.replace(/"/g, "") : setting.value);
        if (!isNaN(parsed) && parsed > 0) dailyLimit = parsed;
      }
    } catch {}

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: sentTodayCount } = await sb
      .from("notification_outbox")
      .select("*", { count: "exact", head: true })
      .eq("type", "support_broadcast")
      .gte("cree_le", todayStart.toISOString());

    const remainingQuota = Math.max(0, dailyLimit - (sentTodayCount ?? 0));

    let sentCount = 0;
    let failedCount = 0;

    for (const t of targets) {
      if (sentCount >= remainingQuota) {
        await sb
          .from("support_broadcast_recipients")
          .update({
            email_statut: "échoué",
            email_erreur: `Quota quotidien atteint (${dailyLimit}/jour)`,
          })
          .eq("broadcast_id", broadcast.id)
          .eq("merchant_id", t.merchant_id);
        failedCount++;
        continue;
      }

      try {
        const res = await sendBroadcastEmailNotification({
          broadcastId: broadcast.id,
          recipientEmail: t.email,
          titre,
          message,
          merchantId: t.merchant_id,
        });

        if (res.success) {
          sentCount++;
          await sb
            .from("support_broadcast_recipients")
            .update({ email_statut: "envoyé" })
            .eq("broadcast_id", broadcast.id)
            .eq("merchant_id", t.merchant_id);
        } else {
          failedCount++;
          await sb
            .from("support_broadcast_recipients")
            .update({
              email_statut: "échoué",
              email_erreur: res.error ?? "Échec d'envoi SMTP",
            })
            .eq("broadcast_id", broadcast.id)
            .eq("merchant_id", t.merchant_id);
        }
      } catch (err) {
        failedCount++;
        await sb
          .from("support_broadcast_recipients")
          .update({
            email_statut: "échoué",
            email_erreur: err instanceof Error ? err.message : "Erreur inconnue",
          })
          .eq("broadcast_id", broadcast.id)
          .eq("merchant_id", t.merchant_id);
      }
    }

    await sb
      .from("support_broadcasts")
      .update({
        envoyes_count: sentCount,
        echoues_count: failedCount,
        statut: "terminee",
      })
      .eq("id", broadcast.id);

    return {
      success: true,
      broadcast_id: broadcast.id,
      destinataires_count: targets.length,
      envoyes_count: sentCount,
      echoues_count: failedCount,
    };
  });

export const adminSendTestBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { titre: string; message: string }) => d)
  .handler(async ({ data, context }) => {
    const sb = supabaseAdmin;
    const adminId = (context as any).userId;
    const { data: isAdminData } = await sb.rpc("has_role", { _user_id: adminId, _role: "admin" });
    if (!isAdminData) throw new Error("Accès refusé");

    const { data: authUser } = await sb.auth.admin.getUserById(adminId);
    const adminEmail = authUser?.user?.email;
    if (!adminEmail) throw new Error("Adresse email administrateur introuvable");

    const res = await sendBroadcastEmailNotification({
      broadcastId: "test-preview",
      recipientEmail: adminEmail,
      titre: `[TEST] ${data.titre}`,
      message: data.message,
    });

    if (!res.success) {
      throw new Error(res.error || "Échec d'envoi de l'e-mail test.");
    }

    return { success: true, email: adminEmail };
  });

export const adminListBroadcasts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SupportBroadcast[]> => {
    const sb = supabaseAdmin;
    const { data: isAdminData } = await sb.rpc("has_role", { _user_id: (context as any).userId, _role: "admin" });
    if (!isAdminData) throw new Error("Accès refusé");

    const { data: broadcasts, error } = await sb
      .from("support_broadcasts")
      .select("*")
      .order("cree_le", { ascending: false });

    if (error) throw new Error(error.message);

    // Synchronisation en temps réel du nombre de lectures
    const { data: recips } = await sb
      .from("support_broadcast_recipients")
      .select("broadcast_id, lu_le");

    const readMap = new Map<string, number>();
    for (const r of (recips ?? [])) {
      if (r.lu_le) {
        readMap.set(r.broadcast_id, (readMap.get(r.broadcast_id) ?? 0) + 1);
      }
    }

    const items = (broadcasts ?? []).map((b: any) => ({
      ...b,
      lus_count: readMap.get(b.id) ?? b.lus_count ?? 0,
    }));

    return items as SupportBroadcast[];
  });

export const listMyBroadcasts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SupportBroadcastItem[]> => {
    const sb = supabaseAdmin;
    const userId = (context as any).userId;

    const { data: recips, error: rErr } = await sb
      .from("support_broadcast_recipients")
      .select("broadcast_id, lu_le, cree_le, support_broadcasts(id, titre, message, cree_le)")
      .eq("merchant_id", userId)
      .order("cree_le", { ascending: false });

    if (rErr) throw new Error(rErr.message);

    const items: SupportBroadcastItem[] = [];
    for (const r of (recips ?? [])) {
      const b = (r as any).support_broadcasts;
      if (b) {
        items.push({
          id: b.id,
          titre: b.titre,
          message: b.message,
          cree_le: b.cree_le,
          lu_le: r.lu_le,
        });
      }
    }
    return items;
  });

export const markBroadcastRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { broadcast_id: string }) => d)
  .handler(async ({ data, context }) => {
    const sb = supabaseAdmin;
    const userId = (context as any).userId;

    const { data: recip } = await sb
      .from("support_broadcast_recipients")
      .select("id, lu_le")
      .eq("broadcast_id", data.broadcast_id)
      .eq("merchant_id", userId)
      .maybeSingle();

    if (recip && !recip.lu_le) {
      await sb
        .from("support_broadcast_recipients")
        .update({ lu_le: new Date().toISOString() })
        .eq("id", recip.id);

      const { data: b } = await sb
        .from("support_broadcasts")
        .select("lus_count")
        .eq("id", data.broadcast_id)
        .maybeSingle();

      if (b) {
        await sb
          .from("support_broadcasts")
          .update({ lus_count: (b.lus_count ?? 0) + 1 })
          .eq("id", data.broadcast_id);
      }
    }

    return { success: true };
  });

