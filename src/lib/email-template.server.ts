import nodemailer from "nodemailer";

/**
 * MASTER TEMPLATE UNIQUE POUR TOUS LES E-MAILS DE MARKETNET
 * Design épuré, typographie soignée, responsive mobile, sans emojis, conforme à la charte officielle MarketNet.
 */

export interface MarketNetEmailOptions {
  to: string;
  subject: string;
  badgeText?: string;
  badgeVariant?: "primary" | "success" | "warning" | "danger" | "neutral";
  title: string;
  preheader?: string;
  contentHtml: string;
  cta?: {
    label: string;
    url: string;
  };
  secondaryText?: string;
}

export function createSmtpTransporter() {
  const host = process.env["SMTP_HOST"] || "smtp.gmail.com";
  const port = Number(process.env["SMTP_PORT"]) || 465;
  const user = process.env["SMTP_USER"]?.trim();
  const pass = process.env["SMTP_PASSWORD"]?.replace(/"/g, "")?.trim();

  if (!user || !pass) {
    console.warn("[MarketNet Email] Identifiants SMTP non configurés.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  primary: { bg: "#EEF2FF", text: "#4F46E5", border: "#C7D2FE" },
  success: { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" },
  warning: { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
  danger:  { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  neutral: { bg: "#F1F5F9", text: "#475569", border: "#E2E8F0" },
};

export function buildOfficialEmailHtml(params: {
  badgeText?: string;
  badgeVariant?: "primary" | "success" | "warning" | "danger" | "neutral";
  title: string;
  preheader?: string;
  contentHtml: string;
  cta?: {
    label: string;
    url: string;
  };
  secondaryText?: string;
}): string {
  const siteUrl = process.env["MARKETNET_SITE_URL"] || "https://appmarketnet.vercel.app";
  const badge = params.badgeText ? BADGE_COLORS[params.badgeVariant || "primary"] : null;
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="fr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${params.title} — MarketNet</title>
  <style>
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      background-color: #F8FAFC;
    }
    table, td {
      border-collapse: collapse !important;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 8px 4px !important;
      }
      .email-card {
        width: 100% !important;
        border-radius: 12px !important;
      }
      .email-header {
        padding: 20px 16px 16px !important;
      }
      .email-body {
        padding: 20px 16px !important;
      }
      .email-footer {
        padding: 16px !important;
      }
      .email-title {
        font-size: 20px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; width: 100% !important;">
  ${params.preheader ? `<div style="display:none;font-size:1px;color:#F8FAFC;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${params.preheader}</div>` : ""}
  
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; background-color: #F8FAFC;">
    <tr>
      <td align="center" class="email-wrapper" style="padding: 32px 12px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" class="email-card" style="width: 100%; max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 18px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.04);">
          
          <!-- EN-TÊTE OFFICIEL MARKETNET -->
          <tr>
            <td class="email-header" style="padding: 28px 32px 20px; background-color: #FFFFFF; border-bottom: 1px solid #F1F5F9;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td valign="middle">
                    <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #0F172A;">
                      Market<span style="color: #4F46E5;">Net</span>
                    </div>
                    <div style="font-size: 11px; font-weight: 500; color: #64748B; margin-top: 3px;">
                      Plateforme officielle de vente en ligne
                    </div>
                  </td>
                  ${params.badgeText && badge ? `
                  <td align="right" valign="middle">
                    <span style="display: inline-block; padding: 5px 12px; background-color: ${badge.bg}; color: ${badge.text}; border: 1px solid ${badge.border}; font-size: 11px; font-weight: 700; border-radius: 9999px; white-space: nowrap;">
                      ${params.badgeText}
                    </span>
                  </td>` : ""}
                </tr>
              </table>
            </td>
          </tr>

          <!-- CORPS DU MESSAGE -->
          <tr>
            <td class="email-body" style="padding: 32px; font-size: 14px; line-height: 1.65; color: #334155;">
              <h1 class="email-title" style="margin: 0 0 16px; font-size: 22px; font-weight: 800; color: #0F172A; line-height: 1.3;">
                ${params.title}
              </h1>

              ${params.contentHtml}

              ${params.cta ? `
              <div style="margin: 28px 0 12px; text-align: center;">
                <a href="${params.cta.url}" style="display: inline-block; background-color: #4F46E5; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 28px; border-radius: 12px; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25);">
                  ${params.cta.label}
                </a>
              </div>` : ""}

              ${params.secondaryText ? `
              <p style="margin: 20px 0 0; font-size: 12px; color: #94A3B8; text-align: center;">
                ${params.secondaryText}
              </p>` : ""}
            </td>
          </tr>

          <!-- PIED DE PAGE OFFICIEL -->
          <tr>
            <td class="email-footer" style="padding: 24px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #64748B; line-height: 1.5;">
              <p style="margin: 0 0 4px; font-weight: 600; color: #475569;">MarketNet RDC</p>
              <p style="margin: 0 0 8px; color: #94A3B8;">Ce message automatique vous est adressé par la plateforme MarketNet.</p>
              <p style="margin: 0;">
                <a href="${siteUrl}" style="color: #4F46E5; text-decoration: none; font-weight: 600;">Visiter le site</a>
                <span style="color: #CBD5E1; margin: 0 6px;">•</span>
                <a href="${siteUrl}/dashboard/support" style="color: #4F46E5; text-decoration: none; font-weight: 600;">Assistance & Support</a>
              </p>
              <p style="margin: 12px 0 0; font-size: 11px; color: #94A3B8;">© ${currentYear} MarketNet. Tous droits réservés.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Envoi d'un e-mail formaté avec le template officiel MarketNet
 */
export async function sendMarketNetEmail(options: MarketNetEmailOptions) {
  const transporter = createSmtpTransporter();
  if (!transporter) {
    return { success: false, error: "SMTP non configuré" };
  }

  const fromName = process.env["SMTP_FROM_NAME"] || "MarketNet";
  const fromUser = process.env["SMTP_USER"] || process.env["MARKETNET_ADMIN_EMAIL"] || "marketnet243@gmail.com";
  const from = `"${fromName}" <${fromUser}>`;

  const html = buildOfficialEmailHtml({
    badgeText: options.badgeText,
    badgeVariant: options.badgeVariant,
    title: options.title,
    preheader: options.preheader,
    contentHtml: options.contentHtml,
    cta: options.cta,
    secondaryText: options.secondaryText,
  });

  try {
    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html,
    });
    return { success: true };
  } catch (err: any) {
    console.error("[MarketNet Email] Erreur d'envoi:", err?.message);
    return { success: false, error: err?.message };
  }
}

/**
 * E-mail officiel de bienvenue pour TOUT NOUVEL UTILISATEUR inscrit
 */
export async function sendUserWelcomeEmail(params: {
  email: string;
  fullName: string;
}) {
  const siteUrl = process.env["MARKETNET_SITE_URL"] || "https://appmarketnet.vercel.app";
  const name = params.fullName?.trim() || "Commerçant";

  const contentHtml = `
    <p style="margin: 0 0 16px;">Bonjour <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px;">
      Nous sommes ravis de vous compter parmi nous. Votre compte personnel MarketNet est prêt.
    </p>
    <div style="background-color: #F8FAFC; border-left: 3px solid #4F46E5; padding: 14px 18px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #1E293B; font-weight: 600;">
        Votre boutique en ligne en 2 minutes
      </p>
      <p style="margin: 6px 0 0; font-size: 12px; color: #64748B;">
        Présentez vos produits, partagez votre lien personnalisé et recevez vos commandes directement sur WhatsApp sans aucune commission.
      </p>
    </div>
    <p style="margin: 16px 0 0;">
      Cliquez ci-dessous pour configurer votre boutique et démarrer votre activité dès aujourd'hui.
    </p>
  `;

  return sendMarketNetEmail({
    to: params.email,
    subject: "Bienvenue sur MarketNet",
    badgeText: "Nouveau compte",
    badgeVariant: "primary",
    title: "Bienvenue sur la plateforme MarketNet",
    preheader: "Votre compte est prêt. Créez votre boutique en quelques clics.",
    contentHtml,
    cta: {
      label: "Créer ma boutique",
      url: `${siteUrl}/onboarding`,
    },
    secondaryText: "Besoin d'aide ? Notre équipe d'assistance reste à votre entière disposition.",
  });
}
