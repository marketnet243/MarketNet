import { Store, ShieldAlert, MessageCircle, MapPin, Clock, Instagram, Facebook } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StoreOfflineViewProps {
  shop: {
    name: string;
    description?: string | null;
    whatsapp?: string | null;
    city?: string | null;
    address?: string | null;
    hours?: string | null;
    facebook?: string | null;
    instagram?: string | null;
    tiktok?: string | null;
  };
  isSuspended?: boolean;
  compact?: boolean;
}

export function StoreOfflineView({ shop, isSuspended = false, compact = false }: StoreOfflineViewProps) {
  const hasWhatsapp = !!shop.whatsapp && shop.whatsapp.replace(/\D/g, "").length >= 8;
  const whatsappDigits = shop.whatsapp?.replace(/\D/g, "") ?? "";
  const hasLocation = !!(shop.city || shop.address);
  const hasHours = !!shop.hours;
  const hasSocials = !!(shop.facebook || shop.instagram || shop.tiktok);

  return (
    <div className={cn("mx-auto w-full max-w-2xl px-4", compact ? "py-6" : "py-10 sm:py-14")}>
      <div className="relative overflow-hidden rounded-3xl border border-current/10 bg-shop-card p-6 sm:p-8 shadow-sm text-center">
        {/* Décoration d'arrière-plan douce */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl opacity-30",
            isSuspended ? "bg-red-500" : "bg-amber-500"
          )}
        />

        {/* Badge & Icône de statut */}
        <div className="relative mx-auto mb-4 flex flex-col items-center">
          <div
            className={cn(
              "flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl shadow-sm ring-8 transition-transform",
              isSuspended
                ? "bg-red-500/10 text-red-600 ring-red-500/5 dark:text-red-400"
                : "bg-amber-500/10 text-amber-600 ring-amber-500/5 dark:text-amber-400"
            )}
          >
            {isSuspended ? (
              <ShieldAlert className="h-8 w-8 sm:h-10 sm:w-10" />
            ) : (
              <Store className="h-8 w-8 sm:h-10 sm:w-10" />
            )}
          </div>

          <span
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase shadow-xs",
              isSuspended
                ? "bg-red-500/15 text-red-700 dark:text-red-300"
                : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isSuspended ? "bg-red-500" : "bg-amber-500 animate-pulse"
              )}
            />
            {isSuspended ? "Boutique suspendue" : "Boutique hors ligne (Mode privé)"}
          </span>
        </div>

        {/* Titre et Explications réalistes */}
        <h2 className="font-shop-heading text-lg sm:text-2xl font-black tracking-tight text-shop-fg">
          {isSuspended
            ? "Vitrine momentanément indisponible"
            : "Cette boutique est actuellement fermée"}
        </h2>

        <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-shop-muted">
          {isSuspended
            ? "Cette vitrine a été suspendue par l'administration MarketNet. L'accès aux produits et la prise de commande sont temporairement désactivés."
            : "Le commerçant prépare actuellement ses nouveautés ou procède à une mise à jour. Les articles et commandes en ligne ne sont pas accessibles pour le moment."}
        </p>

        {/* Bloc Contact Direct Marchand (Présent même si la boutique est fermée) */}
        {!isSuspended && (
          <div className="mt-6 rounded-2xl border border-current/8 bg-shop-bg/60 p-4 sm:p-5 text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-shop-muted">
              Contacter le commerçant
            </p>
            <p className="mt-0.5 text-xs text-shop-fg">
              Besoin d'un renseignement ou d'une commande directe ?
            </p>

            <div className="mt-3 flex flex-wrap gap-2.5">
              {hasWhatsapp && (
                <a
                  href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
                    `Bonjour ${shop.name}, je vous contacte au sujet de votre boutique.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] px-4 text-xs font-bold text-white shadow-sm transition hover:scale-[1.02] active:scale-95"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Écrire sur WhatsApp</span>
                </a>
              )}

              {hasSocials && (
                <div className="flex items-center gap-1.5">
                  {shop.instagram && (
                    <a
                      href={shop.instagram}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Instagram"
                      className="grid h-10 w-10 place-items-center rounded-xl border border-current/10 bg-shop-card text-shop-fg shadow-xs hover:border-[#E1306C]/50 hover:text-[#E1306C] transition"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                  {shop.facebook && (
                    <a
                      href={shop.facebook}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Facebook"
                      className="grid h-10 w-10 place-items-center rounded-xl border border-current/10 bg-shop-card text-shop-fg shadow-xs hover:border-[#1877F2]/50 hover:text-[#1877F2] transition"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Localisation & Horaires */}
            {(hasLocation || hasHours) && (
              <div className="mt-3.5 pt-3 border-t border-current/8 space-y-1.5 text-xs text-shop-muted">
                {hasLocation && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-shop shrink-0" />
                    <span>
                      {shop.address ? `${shop.address}, ` : ""}
                      {shop.city}
                    </span>
                  </div>
                )}
                {hasHours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-shop shrink-0" />
                    <span>{shop.hours}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Message de réassurance */}
        <p className="mt-5 text-[11px] text-shop-muted">
          {isSuspended
            ? "Pour toute assistance, contactez le support MarketNet."
            : "Revenez très bientôt pour découvrir la nouvelle collection !"}
        </p>
      </div>
    </div>
  );
}
