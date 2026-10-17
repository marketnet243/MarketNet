import { useEffect, useState } from "react";
import { Clock, Package, Sparkles, Flame, ArrowRight, Zap } from "lucide-react";
import { mediaUrl } from "@/lib/marketnet";
import { discountLabel, type PromoTemplate } from "@/lib/promotions";
import { cn } from "@/lib/utils";

export type SlidePromo = {
  title: string;
  description: string | null;
  image_url: string | null;
  template: string;
  discount_type: string | null;
  discount_value: number | null;
  button_label: string;
  badge_label?: string | null;
  ends_at: string | null;
};

/** One promotion rendered with the shop theme tokens (bg-shop, text-shop-fg, rounded-shop, font-shop-heading). */
export function PromoSlide({
  promo,
  currency,
  onCta,
  className,
}: {
  promo: SlidePromo;
  currency: string;
  onCta?: () => void;
  className?: string;
}) {
  const t = (promo.template as PromoTemplate) || "fullscreen";
  const img = mediaUrl(promo.image_url);
  const disc = discountLabel(promo.discount_type, promo.discount_value, currency);

  const baseCta = (
    <button
      type="button"
      onClick={onCta}
      className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-shop px-4 sm:px-5 text-xs sm:text-sm font-bold text-shop-foreground shadow-sm transition-all duration-200 hover:brightness-105 hover:shadow-md active:scale-95 shrink-0"
    >
      <span>{promo.button_label || "Profiter de l'offre"}</span>
      <ArrowRight className="h-3.5 w-3.5 opacity-80" />
    </button>
  );

  const base = cn(
    "relative h-[200px] sm:h-[235px] md:h-[265px] w-full overflow-hidden rounded-2xl transition-all duration-300 shadow-sm select-none",
    className
  );

  // 1. HERO IMMERSIF (Visuel plein écran avec cartouche en verre dépoli haut de gamme)
  if (t === "fullscreen") {
    return (
      <div className={cn(base, "group cursor-pointer")}>
        {img ? (
          <img
            src={img}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-shop via-shop/80 to-shop/40" />
        )}
        {/* Dégradés cinéma pour contraste et lisibilité parfaits */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/20" />

        {/* Cartouche flottant en verre dépoli élégant */}
        <div className="absolute left-3 bottom-3 right-3 sm:right-auto sm:left-4 sm:bottom-4 sm:max-w-md rounded-2xl bg-black/65 dark:bg-black/75 p-3.5 sm:p-4.5 text-white shadow-2xl backdrop-blur-xl border border-white/20 transition-all duration-300 group-hover:translate-y-[-2px]">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {disc ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 px-2.5 py-0.5 text-[11px] font-black text-white shadow-md uppercase tracking-wider">
                <Sparkles className="h-2.5 w-2.5" />
                {disc}
              </span>
            ) : promo.badge_label ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-shop px-2.5 py-0.5 text-[11px] font-black text-shop-foreground shadow-xs uppercase tracking-wider">
                <Sparkles className="h-2.5 w-2.5" />
                {promo.badge_label}
              </span>
            ) : null}

            {promo.ends_at && (
              <span className="text-[10px] sm:text-xs text-white/80 font-medium flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-lg backdrop-blur-xs">
                <Clock className="h-3 w-3 opacity-80" />
                <span>Jusqu'au {new Date(promo.ends_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
              </span>
            )}
          </div>

          <div className="space-y-0.5">
            <h2 className="font-shop-heading text-sm sm:text-lg font-black leading-tight line-clamp-1 sm:line-clamp-2 text-white drop-shadow-sm tracking-tight">
              {promo.title}
            </h2>
            {promo.description && (
              <p className="line-clamp-1 text-xs leading-normal text-white/80 font-medium">
                {promo.description}
              </p>
            )}
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={onCta}
              className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-white text-black hover:bg-white/90 px-4 sm:px-5 text-xs sm:text-sm font-bold shadow-lg transition-all duration-200 active:scale-95"
            >
              <span>{promo.button_label || "Profiter de l'offre"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. DUO SHOWCASE (Catalogue vedette : produit en valeur & badge promotionnel)
  if (t === "split") {
    return (
      <div className={cn(base, "group cursor-pointer grid grid-cols-[1.2fr_0.8fr] sm:grid-cols-[1.25fr_0.75fr] bg-gradient-to-br from-shop-card via-shop-card/95 to-shop-bg border border-current/10 shadow-sm")}>
        <div className="flex flex-col justify-center p-3.5 sm:p-5 relative z-10 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {disc && (
              <span className="inline-flex items-center gap-1 rounded-full bg-shop px-2.5 py-0.5 text-[11px] font-black text-shop-foreground shadow-xs">
                {disc}
              </span>
            )}
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-shop/10 text-shop">
              {promo.badge_label || "Offre Vedette"}
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="font-shop-heading text-sm sm:text-xl font-black leading-tight line-clamp-2 text-shop-fg tracking-tight">
              {promo.title}
            </h2>
            {promo.description && (
              <p className="line-clamp-1 sm:line-clamp-2 text-xs leading-relaxed text-shop-muted font-medium">
                {promo.description}
              </p>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">{baseCta}</div>
        </div>

        <div className="relative h-full overflow-hidden p-2 sm:p-3 flex items-center justify-center">
          <div className="relative h-full w-full overflow-hidden rounded-xl shadow-md border border-current/10 bg-muted/20">
            {img ? (
              <img
                src={img}
                alt=""
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
              />
            ) : (
              <div className="grid h-full place-items-center bg-shop/10">
                <Package className="h-8 w-8 sm:h-12 sm:w-12 text-shop/60" />
              </div>
            )}
            {disc && (
              <span className="absolute top-2 right-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white shadow-md">
                {disc}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. FLASH IMPACT (Grand impact promotionnel : sticker 3D, dégradé vibrant)
  if (t === "badge") {
    return (
      <div className={cn(base, "group cursor-pointer bg-gradient-to-r from-shop via-shop/95 to-amber-600 text-shop-foreground relative overflow-hidden shadow-inner")}>
        {/* Cercles de halo lumineux */}
        <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-white/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 right-1/4 h-36 w-36 rounded-full bg-black/25 blur-2xl pointer-events-none" />

        {img && (
          <img
            src={img}
            alt=""
            className="absolute inset-y-0 right-0 h-full w-3/5 sm:w-1/2 object-cover opacity-80 transition-transform duration-700 ease-out group-hover:scale-105"
            style={{ maskImage: "linear-gradient(to right, transparent 0%, black 35%)" }}
          />
        )}

        <div className="relative z-10 flex h-full flex-col justify-center gap-2 p-3.5 sm:p-5 max-w-[85%] sm:max-w-[65%]">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 min-w-10 sm:h-12 sm:min-w-12 px-2.5 place-items-center rounded-xl bg-white text-center font-shop-heading text-xs sm:text-base font-black text-shop shadow-xl ring-2 ring-white/40 rotate-[-2deg] shrink-0">
              {disc ?? "PROMO"}
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-white flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full w-fit">
                <Zap className="h-3 w-3 text-amber-300" /> {promo.badge_label || "Vente Flash"}
              </span>
              {promo.ends_at && (
                <span className="text-[9px] sm:text-[10px] text-white/80 flex items-center gap-1 font-semibold mt-0.5">
                  <Clock className="h-2.5 w-2.5" /> Fin {new Date(promo.ends_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-0.5">
            <h2 className="font-shop-heading text-sm sm:text-xl font-black leading-tight line-clamp-2 text-white drop-shadow-sm tracking-tight">
              {promo.title}
            </h2>
            {promo.description && (
              <p className="line-clamp-1 text-xs leading-normal text-white/90 font-medium">
                {promo.description}
              </p>
            )}
          </div>

          <div className="pt-0.5">
            <button
              type="button"
              onClick={onCta}
              className="inline-flex h-8 sm:h-9 items-center justify-center gap-1.5 rounded-xl bg-white px-4 text-xs font-bold text-shop shadow-md hover:bg-white/95 active:scale-95 transition"
            >
              <span>{promo.button_label || "En profiter"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. CHRONO URGENCE (Urgence avec compte à rebours dynamique stylisé)
  if (t === "countdown") {
    return (
      <div className={cn(base, "group cursor-pointer bg-gradient-to-br from-shop-card via-shop-card/95 to-muted/30 text-shop-fg border border-current/15 relative overflow-hidden")}>
        {img && (
          <img
            src={img}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-15 filter blur-xs transition-transform duration-700 ease-out group-hover:scale-105"
          />
        )}

        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-2 p-3 sm:p-5 text-center max-w-xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 text-white px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-sm animate-pulse">
              <Flame className="h-3 w-3" /> {promo.badge_label || "Vente Flash"}
            </span>
            {disc && (
              <span className="rounded-full bg-shop px-2.5 py-0.5 text-[11px] font-black text-shop-foreground shadow-xs">
                {disc}
              </span>
            )}
          </div>

          <div className="space-y-0.5">
            <h2 className="font-shop-heading text-sm sm:text-lg font-black leading-tight line-clamp-1 sm:line-clamp-2 text-shop-fg tracking-tight">
              {promo.title}
            </h2>
            {promo.description && (
              <p className="line-clamp-1 text-xs leading-relaxed text-shop-muted font-medium">
                {promo.description}
              </p>
            )}
          </div>

          <div className="py-0.5">
            <Countdown end={promo.ends_at} />
          </div>

          <div>
            <button
              type="button"
              onClick={onCta}
              className="inline-flex h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 text-xs sm:text-sm font-bold shadow-md transition active:scale-95"
            >
              <span>{promo.button_label || "Commander avant expiration"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. STUDIO ÉLÉGANCE (Éditorial chic, typographie soignée et visuel encadré)
  return (
    <div className={cn(base, "group cursor-pointer flex items-center justify-between gap-3 sm:gap-6 border border-current/10 bg-gradient-to-r from-shop-card via-shop-card/95 to-shop-bg p-3.5 sm:p-5 shadow-sm")}>
      <div className="min-w-0 flex-1 space-y-1 sm:space-y-1.5">
        <div className="flex items-center gap-2">
          {disc && (
            <span className="font-shop-heading text-xl sm:text-3xl font-black text-shop tracking-tight">
              {disc}
            </span>
          )}
          <span className="text-[10px] uppercase font-bold tracking-widest text-shop-muted px-2 py-0.5 rounded-md bg-muted/60">
            {promo.badge_label || "Collection Spéciale"}
          </span>
        </div>

        <div className="space-y-0.5">
          <h2 className="font-shop-heading text-sm sm:text-lg font-black leading-tight line-clamp-2 text-shop-fg tracking-tight">
            {promo.title}
          </h2>
          {promo.description && (
            <p className="line-clamp-1 sm:line-clamp-2 text-xs leading-relaxed text-shop-muted font-medium">
              {promo.description}
            </p>
          )}
        </div>
        <div className="pt-1">{baseCta}</div>
      </div>

      {img && (
        <div className="h-24 w-24 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-2xl shadow-lg border border-current/10 relative group bg-muted">
          <img
            src={img}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
          />
        </div>
      )}
    </div>
  );
}

function Countdown({ end }: { end: string | null }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  if (!end) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-lg bg-black/5 dark:bg-white/5 px-3 py-1 text-xs font-semibold opacity-80">
        <Clock className="h-3.5 w-3.5" />
        <span>Offre à durée limitée</span>
      </div>
    );
  }

  const ms = Math.max(0, new Date(end).getTime() - (now ?? Date.now()));
  const parts = [
    Math.floor(ms / 86400000),
    Math.floor(ms / 3600000) % 24,
    Math.floor(ms / 60000) % 60,
    Math.floor(ms / 1000) % 60,
  ];
  const labels = ["j", "h", "min", "s"];

  return (
    <div className="flex gap-1.5 sm:gap-2 items-center" aria-label="Temps restant" suppressHydrationWarning>
      {parts.map((v, i) => (
        <div
          key={i}
          className="min-w-[44px] sm:min-w-[50px] rounded-xl bg-card dark:bg-black/80 px-1.5 py-1 text-center shadow-xs border border-current/15"
        >
          <p className="font-shop-heading text-sm sm:text-base font-black tabular-nums tracking-tight text-shop-fg" suppressHydrationWarning>
            {now == null ? "--" : String(v).padStart(2, "0")}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-shop-muted">{labels[i]}</p>
        </div>
      ))}
    </div>
  );
}
