import { Store, ShieldAlert, MessageCircle, MapPin, Clock, Instagram, Facebook, ArrowLeft } from "lucide-react";
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
    <div className={cn("mx-auto w-full max-w-2xl px-4", compact ? "py-4" : "py-10 sm:py-16")}>
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-xs text-center">
        {/* Halo décoratif très doux */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -top-24 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full blur-3xl opacity-20",
            isSuspended ? "bg-rose-500" : "bg-[#4F46E5]"
          )}
        />

        {/* ── ICÔNE & BADGE DE STATUT ÉLÉGANTS ── */}
        <div className="relative mx-auto mb-4 flex flex-col items-center">
          <div
            className={cn(
              "flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl shadow-xs transition-transform",
              isSuspended
                ? "bg-rose-50 text-rose-600 ring-8 ring-rose-50/60"
                : "bg-[#EEF2FF] text-[#4F46E5] ring-8 ring-[#EEF2FF]/60"
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
              "mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide shadow-2xs",
              isSuspended
                ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                : "bg-amber-50 text-amber-700 border border-amber-200/80"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isSuspended ? "bg-rose-500" : "bg-amber-500 animate-pulse"
              )}
            />
            {isSuspended ? "Vitrine temporairement suspendue" : "Boutique en pause"}
          </span>
        </div>

        {/* ── TITRE ET MESSAGE COMPRÉHENSIBLE & CHALEUREUX ── */}
        <h2 className="font-shop-heading text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
          {isSuspended
            ? "Cette vitrine est momentanément indisponible"
            : `La vitrine de ${shop.name} prépare ses nouveautés`}
        </h2>

        <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-slate-500 font-medium">
          {isSuspended
            ? "Cette boutique est temporairement mise en veille par l'administration MarketNet. L'accès au catalogue et aux commandes est suspendu."
            : "Le commerçant met actuellement à jour ses stocks et collections. Vous pouvez toutefois le joindre en direct pour toute question ou commande personnalisée."}
        </p>

        {/* ── BLOC CONTACT DIRECT CLIENT (SUR WHATSAPP) ── */}
        {!isSuspended && (
          <div className="mt-7 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 sm:p-6 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Besoin d'un article ou renseignement ?
                </p>
                <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                  Écrivez directement au commerçant
                </p>
              </div>

              {hasWhatsapp && (
                <a
                  href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
                    `Bonjour ${shop.name}, j'ai vu que votre boutique est en pause, avez-vous des disponibilités actuellement ?`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] px-4 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <MessageCircle className="h-4 w-4 fill-white" />
                  <span>Écrire sur WhatsApp</span>
                </a>
              )}
            </div>

            {/* Réseaux sociaux & Coordonnées */}
            <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
              {(hasLocation || hasHours) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {hasLocation && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#4F46E5] shrink-0" />
                      <span>
                        {shop.address ? `${shop.address}, ` : ""}
                        {shop.city}
                      </span>
                    </span>
                  )}
                  {hasHours && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#4F46E5] shrink-0" />
                      <span>{shop.hours}</span>
                    </span>
                  )}
                </div>
              )}

              {hasSocials && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-semibold">Suivre :</span>
                  {shop.instagram && (
                    <a
                      href={shop.instagram}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Instagram"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs hover:border-[#E1306C]/50 hover:text-[#E1306C] transition-colors"
                    >
                      <Instagram className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {shop.facebook && (
                    <a
                      href={shop.facebook}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Facebook"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs hover:border-[#1877F2]/50 hover:text-[#1877F2] transition-colors"
                    >
                      <Facebook className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── NOTE DE PIED DE PAGE DISCRÈTE ── */}
        <p className="mt-6 text-[11px] text-slate-400">
          {isSuspended
            ? "Pour toute question, veuillez contacter le support officiel MarketNet."
            : "Revenez très bientôt pour découvrir nos prochains articles !"}
        </p>
      </div>
    </div>
  );
}
