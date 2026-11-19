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
  ExternalLink,
  Phone,
  ArrowRight,
  Headphones,
  CheckCircle2,
  Lock,
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

/* ══════════════════════════════════════════════════════════════════════════
   1. HERO SECTION MAJEUR (STYLE VYTRINI : 2 COLONNES OU BANNIÈRE ÉPURÉE)
   ══════════════════════════════════════════════════════════════════════════ */
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
          text: shop.description || `Découvrez la boutique ${shop.name} !`,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Lien de la boutique copié dans le presse-papier !");
    }
  }

  function scrollToCatalogue() {
    if (typeof window !== "undefined") {
      const el = document.getElementById("catalogue");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }

  const descText = shop.description?.trim() || "";

  return (
    <header className="relative overflow-hidden bg-shop-bg text-shop-fg">
      {/* ── HERO BANNER 2 COLONNES HAUT DE GAMME (STYLE VYTRINI) ── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 sm:pt-10 pb-8 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* COLONNE GAUCHE : TEXTE & ACTIONS */}
          <div className="space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-shop/10 px-3.5 py-1 text-xs font-bold text-shop mx-auto lg:mx-0">
              <span className="h-2 w-2 rounded-full bg-shop animate-pulse" />
              <span>{getShopCategoryLabel(shop) || "Boutique Officielle"}</span>
            </div>

            <h1 className="font-shop-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15]">
              {shop.name}
            </h1>

            <p className="text-sm sm:text-base text-shop-muted max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {descText || "Découvrez notre sélection de produits exclusifs et passez commande directement sur WhatsApp en quelques clics."}
            </p>

            {/* BOUTONS D'ACTION CLÉS */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                type="button"
                onClick={scrollToCatalogue}
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-shop text-shop-foreground font-bold text-sm shadow-md hover:brightness-105 transition-all cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Voir la boutique</span>
              </button>

              {hasWhatsapp && (
                <a
                  href={`https://wa.me/${shop.whatsapp?.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Bonjour ${shop.name}, je vous contacte depuis votre boutique en ligne.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm shadow-xs transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-[#25D366]" />
                  <span>WhatsApp direct</span>
                </a>
              )}

              <button
                type="button"
                onClick={handleShare}
                title="Partager"
                aria-label="Partager le lien"
                className="grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* COLONNE DROITE : VISUEL HERO SOIGNÉ (OU BANNIÈRE) */}
          <div className="relative aspect-4/3 sm:aspect-16/10 rounded-3xl overflow-hidden shadow-lift border border-slate-200/80 bg-slate-100 group">
            {banner ? (
              <img
                src={banner}
                alt={shop.name}
                className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-500"
                fetchPriority="high"
              />
            ) : logo ? (
              <div className="h-full w-full flex items-center justify-center bg-slate-50 p-8">
                <img src={logo} alt={shop.name} className="max-h-48 max-w-48 object-contain drop-shadow-md" />
              </div>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50/50 to-slate-100 text-slate-300">
                <Package className="h-16 w-16 opacity-40 mb-2" />
                <span className="font-bold text-sm text-slate-400">Vitrine en ligne officielle</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CHIFFRES CLÉS (STYLE VYTRINI : +200 Produits vendus, +150 Clients satisfaits, Sous 24h) ── */}
      <div className="border-y border-current/10 bg-shop-card/40 py-5">
        <div className="mx-auto max-w-5xl px-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <span className="font-shop-heading text-lg sm:text-2xl font-extrabold text-shop block">+200</span>
            <span className="text-[11px] sm:text-xs text-shop-muted block mt-0.5">Produits vendus</span>
          </div>
          <div className="border-x border-current/10">
            <span className="font-shop-heading text-lg sm:text-2xl font-extrabold text-shop block">+150</span>
            <span className="text-[11px] sm:text-xs text-shop-muted block mt-0.5">Clients satisfaits</span>
          </div>
          <div>
            <span className="font-shop-heading text-lg sm:text-2xl font-extrabold text-shop block">Sous 24 h</span>
            <span className="text-[11px] sm:text-xs text-shop-muted block mt-0.5">Livraison rapide</span>
          </div>
        </div>
      </div>

      {/* ── 4 BADGES DE RÉASSURANCE CLIENT (STYLE VYTRINI) ── */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Truck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-slate-900 leading-tight">Livraison rapide</p>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Partout en RDC</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-slate-900 leading-tight">Retrait en boutique</p>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{shop.city || "Disponible sur place"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Lock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-slate-900 leading-tight">Paiement flexible</p>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Mobile Money & Cash</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-slate-900 leading-tight">Aide WhatsApp</p>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Réponse instantanée</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   2. FICHE PRODUIT STANDARD (EN GRILLE OU LISTE)
   ══════════════════════════════════════════════════════════════════════════ */
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
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-300">
      
      {/* ── IMAGE DU PRODUIT ── */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-103"
          />
        ) : (
          <div className="grid h-full place-items-center text-slate-300">
            <Package className="h-10 w-10 opacity-40" />
          </div>
        )}

        {/* Badges d'état (Promo, Top, Rupture) */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
          {product.discount_badge && (
            <span className="inline-flex items-center rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
              {product.discount_badge}
            </span>
          )}
          {product.featured && !product.discount_badge && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#4F46E5] px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              <Star className="h-2.5 w-2.5 fill-current" />
              <span>Coup de cœur</span>
            </span>
          )}
        </div>

        {/* Masque Rupture de Stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-xs">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white shadow-md">
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
                "w-full h-10 rounded-full font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-transform cursor-pointer",
                addedAnim
                  ? "bg-[#4F46E5] text-white"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
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
      <div className="p-3.5 sm:p-4 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-xs sm:text-sm font-bold text-slate-900 leading-snug group-hover:text-[#4F46E5] transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-col min-w-0">
            {isDiscounted && (
              <span className="text-[11px] text-slate-400 line-through">
                {formatPrice(Number(product.price), product.currency)}
              </span>
            )}
            <span className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
              {formatPrice(displayPrice, product.currency)}
            </span>
          </div>

          {/* Bouton Mobile : Ajout tactile */}
          {onAdd && !isOutOfStock && (
            <button
              type="button"
              onClick={handleQuickAdd}
              aria-label={`Ajouter ${product.name} au panier`}
              className={cn(
                "sm:hidden relative z-10 grid h-8 w-8 place-items-center rounded-full shadow-xs transition-transform cursor-pointer",
                addedAnim
                  ? "bg-[#4F46E5] text-white"
                  : "bg-[#4F46E5] text-white"
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

/* ══════════════════════════════════════════════════════════════════════════
   3. SECTION ATOUTS (POURQUOI NOUS CHOISIR)
   ══════════════════════════════════════════════════════════════════════════ */
export function StoreFeaturesSection({ shopName }: { shopName: string }) {
  const atouts = [
    {
      title: "Qualité garantie",
      desc: "Chaque article est rigoureusement sélectionné et vérifié avant expédition.",
      icon: CheckCircle2,
    },
    {
      title: "Conseils personnalisés",
      desc: "Nous vous guidons par message pour choisir exactement ce qui vous convient.",
      icon: Headphones,
    },
    {
      title: "Disponibilité immédiate",
      desc: "Stock réel en boutique avec préparation de votre commande sans délai.",
      icon: Zap,
    },
    {
      title: "Paiement sécurisé",
      desc: "Réglez en toute confiance par Mobile Money ou en espèces à la livraison.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="mt-14 pt-10 border-t border-slate-200/80">
      <div className="text-center max-w-xl mx-auto mb-8">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5]">Atouts</p>
        <h2 className="mt-1 font-shop-heading text-xl sm:text-2xl font-extrabold text-slate-900">
          Pourquoi choisir {shopName}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {atouts.map((a) => {
          const Icon = a.icon;
          return (
            <div key={a.title} className="p-5 rounded-3xl bg-white border border-slate-200/70 shadow-xs space-y-2.5">
              <div className="h-10 w-10 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">{a.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{a.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
