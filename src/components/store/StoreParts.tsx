import {
  Clock,
  MapPin,
  Facebook,
  Instagram,
  MessageCircle,
  Plus,
  Star,
  ShoppingBag,
  Package,
  BadgeCheck,
  Share2,
  Sparkles,
  ShieldCheck,
  Truck,
  Zap,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { Shop, Product } from "@/hooks/useMyShop";
import { formatPrice, mediaUrl, getShopCategoryLabel } from "@/lib/marketnet";
import { cn } from "@/lib/utils";
import React, { useState } from "react";

type ShopLike = Pick<
  Shop,
  | "name"
  | "description"
  | "logo_url"
  | "banner_url"
  | "category"
  | "category_custom"
  | "city"
  | "hours"
  | "whatsapp"
  | "facebook"
  | "instagram"
>;

export function StoreHeader({
  shop,
  compact,
  isPublished = true,
  isSuspended = false,
}: {
  shop: ShopLike;
  compact?: boolean;
  isPublished?: boolean;
  isSuspended?: boolean;
}) {
  const [descExpanded, setDescExpanded] = useState(false);
  const banner = mediaUrl(shop.banner_url);
  const logo = mediaUrl(shop.logo_url);
  const hasWhatsapp = (shop.whatsapp?.replace(/\D/g, "") || "").length >= 8;

  function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      navigator
        .share({
          title: shop.name,
          text: shop.description || `Découvrez la boutique ${shop.name} sur MarketNet !`,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Lien de la boutique copié dans le presse-papier !");
    }
  }

  const descText = shop.description?.trim() || "";
  const isLongDesc = descText.length > 180;

  return (
    <header className="pb-4">
      {/* ── BANIÈRE PANORAMIQUE HAUT DE GAMME ── */}
      <div className="mx-auto max-w-5xl px-3 sm:px-4 pt-2 sm:pt-4">
        <div
          className={cn(
            "relative isolate w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-md border border-border/60 bg-muted/30 transition-all",
            compact ? "h-28 sm:h-36" : "h-44 sm:h-64 lg:h-72"
          )}
          style={
            banner
              ? undefined
              : {
                  backgroundImage:
                    "radial-gradient(ellipse at 80% 20%, color-mix(in srgb, var(--shop-primary) 45%, transparent), transparent 50%), radial-gradient(ellipse at 10% 90%, color-mix(in srgb, var(--shop-primary) 30%, transparent), transparent 45%), linear-gradient(135deg, color-mix(in srgb, var(--shop-bg) 85%, var(--shop-primary)), var(--shop-bg))",
                }
          }
        >
          {banner ? (
            <>
              <img
                src={banner}
                alt={`Bannière de ${shop.name}`}
                className="absolute inset-0 h-full w-full object-cover"
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/5" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-10 select-none">
              <span className="text-8xl sm:text-9xl font-black text-foreground">{shop.name.slice(0, 2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── CARTE D'IDENTITÉ & ACTIONS COMMERÇANT ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="relative -mt-10 sm:-mt-14 z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          
          {/* Logo & Titre */}
          <div className="flex items-end gap-3.5 sm:gap-5">
            {/* Logo en squircle doux avec ombre portée */}
            <div className="relative group shrink-0">
              <div
                className={cn(
                  "relative grid place-items-center overflow-hidden rounded-2xl sm:rounded-3xl border-4 border-background bg-card font-shop-heading font-black text-shop shadow-lift ring-1 ring-black/10 transition-transform duration-300 ",
                  compact ? "h-16 w-16" : "h-20 w-20 sm:h-26 sm:w-26"
                )}
              >
                {logo ? (
                  <img src={logo} alt={shop.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="select-none text-2xl sm:text-4xl font-black text-primary">
                    {shop.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Badge Boutique Officielle */}
              <div
                className="absolute -bottom-1 -right-1 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-background p-0.5 shadow-md"
                title="Boutique Vérifiée MarketNet"
              >
                <BadgeCheck className="h-full w-full text-success fill-success/20" />
              </div>
            </div>

            {/* Titre & Statut (Mobile & Desktop) */}
            <div className="space-y-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                {getShopCategoryLabel(shop) && (
                  <span className="inline-flex items-center rounded-lg bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-bold tracking-normal uppercase">
                    {getShopCategoryLabel(shop)}
                  </span>
                )}

                {/* Badge d'ouverture en direct */}
                {isSuspended ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/15 text-destructive dark:text-destructive px-2.5 py-0.5 text-[11px] font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    Suspendue
                  </span>
                ) : !isPublished ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-warning/15 text-warning dark:text-warning px-2.5 py-0.5 text-[11px] font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                    Fermée
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 text-success dark:text-success px-2.5 py-0.5 text-[11px] font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    Ouvert
                  </span>
                )}
              </div>

              <h1 className="font-shop-heading font-black tracking-normal text-xl sm:text-2xl lg:text-3xl text-foreground">
                {shop.name}
              </h1>
            </div>
          </div>

          {/* Boutons d'Action (WhatsApp direct + Partage + Réseaux sociaux) */}
          <div className="flex items-center gap-2 self-start sm:self-end pb-1 w-full sm:w-auto">
            {hasWhatsapp && (
              <a
                href={`https://wa.me/${shop.whatsapp?.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Bonjour ${shop.name}, je vous contacte depuis votre boutique en ligne MarketNet.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-initial inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-xl bg-whatsapp hover:bg-whatsapp/90 px-5 text-xs sm:text-sm font-bold text-primary-foreground shadow-md shadow-success/25 transition-all   cursor-pointer select-none"
              >
                <MessageCircle className="h-4 w-4 fill-white" />
                <span>Discuter sur WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleShare}
              title="Partager le lien de la boutique"
              aria-label="Partager le lien de la boutique"
              className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-xl border border-border/80 bg-background/90 text-foreground shadow-xs hover:border-primary/40 hover:text-primary transition-all  cursor-pointer shrink-0"
            >
              <Share2 className="h-4 w-4" />
            </button>

            {shop.instagram && (
              <a
                href={shop.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Page Instagram"
                className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-xl border border-border/80 bg-background/90 text-foreground shadow-xs hover:border-[#E1306C]/50 hover:text-[#E1306C] transition-all  shrink-0"
              >
                <Instagram className="h-4 w-4" />
              </a>
            )}

            {shop.facebook && (
              <a
                href={shop.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Page Facebook"
                className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-xl border border-border/80 bg-background/90 text-foreground shadow-xs hover:border-[#1877F2]/50 hover:text-[#1877F2] transition-all  shrink-0"
              >
                <Facebook className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* ── DESCRIPTION AVEC DÉPLIAGE FLUIDE ── */}
        {descText && (
          <div className="mt-4 max-w-3xl space-y-1">
            <p
              className={cn(
                "text-xs sm:text-sm leading-relaxed text-muted-foreground whitespace-pre-line transition-all",
                !descExpanded && isLongDesc && "line-clamp-3"
              )}
            >
              {descText}
            </p>
            {isLongDesc && (
              <button
                type="button"
                onClick={() => setDescExpanded(!descExpanded)}
                className="text-xs font-bold text-primary hover:underline cursor-pointer pt-0.5"
              >
                {descExpanded ? "Voir moins" : "Lire la suite..."}
              </button>
            )}
          </div>
        )}

        {/* ── LOCALISATION & HORAIRES ── */}
        {(shop.city || shop.hours) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {shop.city && (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{shop.city}</span>
              </span>
            )}
            {shop.hours && (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate max-w-[280px] sm:max-w-none">{shop.hours}</span>
              </span>
            )}
          </div>
        )}

        {/* ── BADGES DE RÉASSURANCE CLIENT — grille 2×2 mobile, 3 colonnes desktop ── */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 select-none">
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 p-2.5">
            <div className="h-7 w-7 rounded-lg bg-success/10 text-success dark:text-success flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-foreground text-[11px] leading-tight">Direct Vendeur</p>
              <p className="text-[10px] text-muted-foreground leading-tight truncate">0 intermédiaire</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 p-2.5">
            <div className="h-7 w-7 rounded-lg bg-whatsapp/10 text-whatsapp flex items-center justify-center shrink-0">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-foreground text-[11px] leading-tight">WhatsApp</p>
              <p className="text-[10px] text-muted-foreground leading-tight truncate">Commande directe</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 p-2.5 col-span-2 sm:col-span-1">
            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Truck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-foreground text-[11px] leading-tight">Livraison & Paiement</p>
              <p className="text-[10px] text-muted-foreground leading-tight truncate">Mobile Money ou Cash</p>
            </div>
          </div>
        </div>

        <div className="mt-5 h-px bg-border/40" />
      </div>
    </header>
  );
}

export function ProductCard({
  product,
  onAdd,
  href,
}: {
  product: Pick<Product, "name" | "price" | "currency" | "images" | "status" | "featured"> & {
    original_price?: number;
    discounted_price?: number | null;
    discount_badge?: string | null;
  };
  onAdd?: () => void;
  href?: React.ReactNode;
}) {
  const [addedAnim, setAddedAnim] = useState(false);
  const img = mediaUrl(product.images?.[0]);
  const isOutOfStock = product.status === "out_of_stock";
  const isDiscounted =
    product.discounted_price != null && product.discounted_price < Number(product.price);
  const displayPrice = isDiscounted ? product.discounted_price! : Number(product.price);

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!onAdd || isOutOfStock) return;
    onAdd();
    setAddedAnim(true);
    toast.success(`« ${product.name} » ajouté au panier !`);
    setTimeout(() => setAddedAnim(false), 900);
  }

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-shop-card shadow-xs hover:shadow-lift hover:-translate-y-1 transition-all duration-300">
      
      {/* ── IMAGE DU PRODUIT ── */}
      <div className="relative aspect-square overflow-hidden bg-muted/20">
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out "
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground/30">
            <Package className="h-10 w-10 opacity-40" />
          </div>
        )}

        {/* Badges d'état (Promo, Top, Rupture) */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
          {product.discount_badge && (
            <span className="inline-flex items-center rounded-full bg-destructive px-2 py-0.5 text-[10px] font-black text-primary-foreground shadow-md">
              {product.discount_badge}
            </span>
          )}
          {product.featured && !product.discount_badge && (
            <span className="inline-flex items-center gap-1 rounded-full bg-shop px-2 py-0.5 text-[10px] font-bold text-shop-foreground shadow-xs">
              <Star className="h-2.5 w-2.5 fill-current" />
              <span>Coup de cœur</span>
            </span>
          )}
        </div>

        {/* Masque Rupture de Stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-overlay/40 backdrop-blur-xs">
            <span className="rounded-full bg-background/95 px-3 py-1 text-xs font-bold text-muted-foreground shadow-md">
              Rupture de stock
            </span>
          </div>
        )}

        {/* Bouton Desktop d'ajout rapide au survol */}
        {onAdd && !isOutOfStock && (
          <div className="hidden sm:flex absolute inset-0 items-end justify-center p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              type="button"
              onClick={handleQuickAdd}
              aria-label={`Ajouter ${product.name} au panier`}
              className={cn(
                "w-full h-10 rounded-xl font-bold text-xs shadow-lift flex items-center justify-center gap-1.5 transition-transform  cursor-pointer",
                addedAnim
                  ? "bg-success text-primary-foreground"
                  : "bg-shop text-shop-foreground hover:brightness-105"
              )}
            >
              {addedAnim ? (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Ajouté !</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  <span>Ajouter au panier</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── INFORMATIONS PRODUIT ── */}
      <div className="p-3 sm:p-4 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-xs sm:text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
          <div className="flex flex-col min-w-0">
            {isDiscounted && (
              <span className="text-[11px] text-muted-foreground line-through font-mono">
                {formatPrice(Number(product.price), product.currency)}
              </span>
            )}
            <span
              className={cn(
                "text-sm sm:text-base font-black font-mono text-primary truncate",
                isDiscounted && "text-destructive dark:text-destructive"
              )}
            >
              {formatPrice(displayPrice, product.currency)}
            </span>
          </div>

          {/* Bouton Mobile : Ajout rapide tactile */}
          {onAdd && !isOutOfStock && (
            <button
              type="button"
              onClick={handleQuickAdd}
              aria-label={`Ajouter ${product.name} au panier`}
              className={cn(
                "sm:hidden relative z-10 grid h-8 w-8 place-items-center rounded-xl shadow-xs transition-transform  cursor-pointer",
                addedAnim
                  ? "bg-success text-primary-foreground"
                  : "bg-shop text-shop-foreground"
              )}
            >
              {addedAnim ? <Check className="h-4 w-4 stroke-[3]" /> : <Plus className="h-4 w-4 stroke-[3]" />}
            </button>
          )}
        </div>
      </div>

      {href}
    </div>
  );
}
