import nodemailer from "nodemailer";

/**
 * Emails transactionnels pour le workflow de suppression de compte.
 * Ton sobre, professionnel, en francais, sans emojis.
 */

function createSmtpTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD?.replace(/"/g, "")?.trim();
  if (!user || !pass) {
    console.warn("[AccountDeletionEmail] Identifiants SMTP non configures.");
    return null;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function buildEmailShell(params: {
  badgeText: string;
  badgeColor: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const siteUrl  = process.env.MARKETNET_SITE_URL || "https://appmarketnet.vercel.app";
  const fromName = process.env.SMTP_FROM_NAME || "MarketNet";
  const cta = params.ctaLabel && params.ctaUrl ? `
    <div style="text-align: center; margin: 28px 0 12px;">
      <a href="${params.ctaUrl}" style="display: inline-block; background-color: #1e293b; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 10px;">
        ${params.ctaLabel}
      </a>
    </div>` : "";
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.title} -- ${fromName}</title>
</head>
<body style="margin:0;padding:24px;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
    <tr>
      <td style="padding:28px 32px 20px;border-bottom:2px solid #f1f5f9;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0"><tr>
          <td><div style="font-size:24px;font-weight:900;letter-spacing:-0.5px;color:#0f172a;">Market<span style="color:#f97316;">Net</span></div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">La plateforme e-commerce des commercants de RDC</div></td>
          <td align="right"><span style="display:inline-block;padding:6px 12px;background-color:${params.badgeColor};font-size:11px;font-weight:700;border-radius:9999px;border:1px solid #e2e8f0;">${params.badgeText}</span></td>
        </tr></table>
      </td>
    </tr>
    <tr><td style="padding:28px 32px 20px;">${params.body}${cta}</td></tr>
    <tr>
      <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#94a3b8;">
        <p style="margin:2px 0;">© ${new Date().getFullYear()} MarketNet Africa</p>
        <p style="margin:2px 0;">Ceci est une notification automatique. Ne repondez pas directement a cet e-mail.</p>
        <p style="margin:4px 0;"><a href="${siteUrl}" style="color:#f97316;text-decoration:none;">${siteUrl}</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendEmail(params: { to: string; subject: string; html: string }) {
  const transporter = createSmtpTransporter();
  if (!transporter) return { success: false, error: "SMTP non configure" };
  const from = process.env.SMTP_FROM_NAME
    ? `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_USER}>`
    : process.env.SMTP_USER;
  try {
    await transporter.sendMail({ from, to: params.to, subject: params.subject, html: params.html });
    return { success: true };
  } catch (err: any) {
    console.error("[AccountDeletionEmail] Erreur envoi:", err?.message);
    return { success: false, error: err?.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Demande reçue — envoi au commerçant
// ─────────────────────────────────────────────────────────────────────────────
export async function sendDeletionRequestEmail(params: {
  email: string;
  fullName: string;
  shopName: string;
}) {
  const supportEmail = process.env.MARKETNET_ADMIN_EMAIL || process.env.SMTP_USER || "support@marketnet.cd";
  const body = `
    <h2 style="font-size:18px;font-weight:800;margin:0 0 8px;color:#0f172a;">Votre demande a ete reçue</h2>
    <p style="font-size:14px;color:#475569;margin:0 0 20px;">Bonjour ${params.fullName},</p>
    <p style="font-size:14px;color:#475569;margin:0 0 16px;">
      Nous avons bien reçu votre demande de suppression de compte
      ${params.shopName ? `(boutique <strong>${params.shopName}</strong>)` : ""}.
    </p>
    <p style="font-size:14px;color:#475569;margin:0 0 16px;">
      Notre equipe va examiner votre demande dans les plus brefs delais. 
      Vous recevrez un second message lorsque votre demande aura ete traitee, 
      avec la date prevue de suppression definitive.
    </p>
    <p style="font-size:14px;color:#475569;margin:0 0 8px;">
      Si vous avez soumis cette demande par erreur, vous pouvez l'annuler depuis vos reglages de compte 
      tant qu'elle n'a pas encore ete traitee.
    </p>
    <p style="font-size:14px;color:#475569;margin:0 0 0;">
      Pour toute question, contactez notre support : <a href="mailto:${supportEmail}" style="color:#f97316;">${supportEmail}</a>
    </p>`;
  const html = buildEmailShell({
    badgeText: "Demande de suppression",
    badgeColor: "#fef3c7",
    title: "Demande de suppression de compte",
    body,
    ctaLabel: "Acceder a mes reglages",
    ctaUrl: (process.env.MARKETNET_SITE_URL || "https://appmarketnet.vercel.app") + "/dashboard/reglages",
  });
  return sendEmail({ to: params.email, subject: "Votre demande de suppression de compte a ete reçue — MarketNet", html });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Demande traitée — compte suspendu, date de suppression fixée
// ─────────────────────────────────────────────────────────────────────────────
export async function sendDeletionProcessedEmail(params: {
  email: string;
  fullName: string;
  shopName: string;
  deletionDate: string;
}) {
  const supportEmail = process.env.MARKETNET_ADMIN_EMAIL || process.env.SMTP_USER || "support@marketnet.cd";
  const body = `
    <h2 style="font-size:18px;font-weight:800;margin:0 0 8px;color:#0f172a;">Votre compte est suspendu</h2>
    <p style="font-size:14px;color:#475569;margin:0 0 20px;">Bonjour ${params.fullName},</p>
    <p style="font-size:14px;color:#475569;margin:0 0 16px;">
      Votre demande de suppression de compte
      ${params.shopName ? `(boutique <strong>${params.shopName}</strong>)` : ""} 
      a ete traitee par notre equipe.
    </p>
    <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin:0 0 20px;">
      <p style="font-size:14px;font-weight:700;color:#b91c1c;margin:0 0 4px;">Date de suppression prevue</p>
      <p style="font-size:20px;font-weight:900;color:#0f172a;margin:0;">${params.deletionDate}</p>
    </div>
    <p style="font-size:14px;color:#475569;margin:0 0 16px;">
      Votre boutique et vos donnees seront supprimes definitivement a cette date. 
      D'ici la, votre boutique n'est plus visible en ligne.
    </p>
    <p style="font-size:14px;color:#475569;margin:0 0 8px;">
      Si vous changez d'avis ou si cette suppression est une erreur, contactez notre support 
      avant la date ci-dessus afin que nous puissions restaurer votre compte.
    </p>
    <p style="font-size:14px;color:#475569;margin:0;">
      Support : <a href="mailto:${supportEmail}" style="color:#f97316;">${supportEmail}</a>
    </p>`;
  const html = buildEmailShell({
    badgeText: "Compte suspendu",
    badgeColor: "#fee2e2",
    title: "Votre compte est suspendu — suppression programmee",
    body,
  });
  return sendEmail({ to: params.email, subject: `Suppression de votre compte programmee au ${params.deletionDate} — MarketNet`, html });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Rappel 7 jours avant suppression definitive
// ─────────────────────────────────────────────────────────────────────────────
export async function sendDeletionReminderEmail(params: {
  email: string;
  fullName: string;
  shopName: string;
  deletionDate: string;
}) {
  const supportEmail = process.env.MARKETNET_ADMIN_EMAIL || process.env.SMTP_USER || "support@marketnet.cd";
  const body = `
    <h2 style="font-size:18px;font-weight:800;margin:0 0 8px;color:#0f172a;">Rappel : suppression dans 7 jours</h2>
    <p style="font-size:14px;color:#475569;margin:0 0 20px;">Bonjour ${params.fullName},</p>
    <p style="font-size:14px;color:#475569;margin:0 0 16px;">
      Nous vous rappelons que votre compte${params.shopName ? ` et votre boutique <strong>${params.shopName}</strong>` : ""} 
      seront supprimes definitivement le <strong>${params.deletionDate}</strong>, 
      soit dans 7 jours.
    </p>
    <p style="font-size:14px;color:#475569;margin:0 0 16px;">
      Toutes vos donnees (boutique, produits, commandes) seront supprimees sans possibilite de recuperation.
    </p>
    <p style="font-size:14px;color:#475569;margin:0;">
      Si vous souhaitez conserver votre compte, contactez notre support sans delai : 
      <a href="mailto:${supportEmail}" style="color:#f97316;">${supportEmail}</a>
    </p>`;
  const html = buildEmailShell({
    badgeText: "Rappel suppression",
    badgeColor: "#fef3c7",
    title: "Rappel : suppression definitive dans 7 jours",
    body,
  });
  return sendEmail({ to: params.email, subject: `Rappel : suppression de votre compte le ${params.deletionDate} — MarketNet`, html });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Suppression effective — compte supprime
// ─────────────────────────────────────────────────────────────────────────────
export async function sendDeletionCompletedEmail(params: {
  email: string;
  fullName: string;
  shopName: string;
}) {
  const body = `
    <h2 style="font-size:18px;font-weight:800;margin:0 0 8px;color:#0f172a;">Votre compte a ete supprime</h2>
    <p style="font-size:14px;color:#475569;margin:0 0 20px;">Bonjour ${params.fullName},</p>
    <p style="font-size:14px;color:#475569;margin:0 0 16px;">
      Conformement a votre demande, votre compte MarketNet
      ${params.shopName ? `(boutique <strong>${params.shopName}</strong>)` : ""} 
      a ete definitivement supprime.
    </p>
    <p style="font-size:14px;color:#475569;margin:0 0 16px;">
      Toutes vos donnees ont ete effacees de nos systemes, a l'exception des donnees 
      conservees par obligation legale (historique comptable anonymise).
    </p>
    <p style="font-size:14px;color:#475569;margin:0;">
      Nous vous remercions d'avoir utilise MarketNet. Si vous souhaitez nous rejoindre 
      de nouveau a l'avenir, vous pouvez creer un nouveau compte sur notre plateforme.
    </p>`;
  const html = buildEmailShell({
    badgeText: "Compte supprime",
    badgeColor: "#f1f5f9",
    title: "Votre compte MarketNet a ete supprime",
    body,
    ctaLabel: "Revenir sur MarketNet",
    ctaUrl: process.env.MARKETNET_SITE_URL || "https://appmarketnet.vercel.app",
  });
  return sendEmail({ to: params.email, subject: "Votre compte MarketNet a ete supprime — confirmation", html });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Compte restaure par l'admin
// ─────────────────────────────────────────────────────────────────────────────
export async function sendDeletionRestoredEmail(params: {
  email: string;
  fullName: string;
  shopName: string;
}) {
  const siteUrl = process.env.MARKETNET_SITE_URL || "https://appmarketnet.vercel.app";
  const body = `
    <h2 style="font-size:18px;font-weight:800;margin:0 0 8px;color:#0f172a;">Votre compte a ete restaure</h2>
    <p style="font-size:14px;color:#475569;margin:0 0 20px;">Bonjour ${params.fullName},</p>
    <p style="font-size:14px;color:#475569;margin:0 0 16px;">
      Votre compte MarketNet${params.shopName ? ` et votre boutique <strong>${params.shopName}</strong>` : ""} 
      ont ete restaures par notre equipe. La suppression programmee a ete annulee.
    </p>
    <p style="font-size:14px;color:#475569;margin:0 0 16px;">
      Vous pouvez vous reconnecter et reprendre votre activite normalement.
    </p>
    <p style="font-size:14px;color:#475569;margin:0;">
      Si vous avez des questions, contactez notre support depuis votre tableau de bord.
    </p>`;
  const html = buildEmailShell({
    badgeText: "Compte restaure",
    badgeColor: "#dcfce7",
    title: "Votre compte MarketNet a ete restaure",
    body,
    ctaLabel: "Acceder a mon tableau de bord",
    ctaUrl: siteUrl + "/dashboard",
  });
  return sendEmail({ to: params.email, subject: "Votre compte MarketNet a ete restaure — MarketNet", html });
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Notification admin — nouvelle demande
// ─────────────────────────────────────────────────────────────────────────────
export async function sendDeletionAdminNotificationEmail(params: {
  merchantEmail: string;
  merchantName: string;
  shopName: string;
  reason: string;
  requestId: string;
}) {
  const transporter = createSmtpTransporter();
  if (!transporter) return { success: false };
  const adminEmail = process.env.MARKETNET_ADMIN_EMAIL || process.env.SMTP_USER;
  if (!adminEmail) return { success: false };
  const siteUrl = process.env.MARKETNET_SITE_URL || "https://appmarketnet.vercel.app";
  const from = process.env.SMTP_FROM_NAME
    ? `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_USER}>`
    : process.env.SMTP_USER;
  const body = `
    <h2 style="font-size:18px;font-weight:800;margin:0 0 8px;color:#0f172a;">Nouvelle demande de suppression</h2>
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:20px;">
      <tr><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;font-weight:600;width:140px;">Commercant</td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;">${params.merchantName}</td></tr>
      <tr><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;font-weight:600;">E-mail</td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;">${params.merchantEmail}</td></tr>
      <tr><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;font-weight:600;">Boutique</td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;">${params.shopName || "—"}</td></tr>
      <tr><td style="padding:10px 16px;font-size:12px;color:#64748b;font-weight:600;">Motif</td><td style="padding:10px 16px;font-size:14px;">${params.reason}</td></tr>
    </table>
    <p style="font-size:14px;margin:0 0 16px;"><a href="${siteUrl}/admin/demandes-suppression" style="color:#f97316;font-weight:700;">Traiter la demande dans l'administration</a></p>`;
  const html = buildEmailShell({ badgeText: "Admin", badgeColor: "#f1f5f9", title: "Nouvelle demande de suppression", body });
  try {
    await transporter.sendMail({ from, to: adminEmail, subject: `Demande de suppression — ${params.merchantName || params.merchantEmail}`, html });
    return { success: true };
  } catch (err: any) {
    console.error("[AccountDeletionEmail] Admin notif error:", err?.message);
    return { success: false };
  }
}
