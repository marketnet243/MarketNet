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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import type { Shop, Product } from "@/hooks/useMyShop";
import { formatPrice, mediaUrl, getShopCategoryLabel } from "@/lib/marketnet";
import { cn } from "@/lib/utils";
import React, { useState, useRef, useEffect } from "react";

/** Hook : anime simultanément les compteurs dès l'ouverture de la page et lors du scroll */
function useMetricsCounter() {
  const [sold, setSold] = useState(0);
  const [clients, setClients] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    function startAnimation() {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const duration = 1400;
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setSold(Math.round(eased * 200));
        setClients(Math.round(eased * 150));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    // Démarrage immédiat dès que le composant est monté
    const autoTimer = setTimeout(startAnimation, 100);

    const el = ref.current;
    if (!el) return () => clearTimeout(autoTimer);

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startAnimation();
        }
      },
      { threshold: 0.05 }
    );
    obs.observe(el);

    return () => {
      clearTimeout(autoTimer);
      obs.disconnect();
    };
  }, []);

  return { sold, clients, ref };
}

type ShopLike = Pick<
  Shop,
  | "name"
  | "slug"
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
> & {
  tiktok?: string | null;
};

function formatSocialUrl(handleOrUrl: string, platform: "facebook" | "instagram" | "tiktok") {
  const clean = handleOrUrl.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
  const username = clean.replace(/^@/, "");
  if (platform === "facebook") return `https://facebook.com/${username}`;
  if (platform === "instagram") return `https://instagram.com/${username}`;
  if (platform === "tiktok") return `https://tiktok.com/@${username}`;
  return clean;
}

/* ══════════════════════════════════════════════════════════════════════════
   1. HERO SECTION HAUT DE GAMME AVEC BANNIÈRE EN BACKGROUND & OMBRE NETTE
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
  const banner = mediaUrl(shop.banner_url);
  const hasWhatsapp = (shop.whatsapp?.replace(/\D/g, "") || "").length >= 8;
  // Couleur primaire de la boutique (depuis CSS var ou fallback indigo)
  const primaryColor = "#4F46E5";
  const isVerified = isPublished && !isSuspended;

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

  const descText = shop.description?.trim() || "";
  const [descExpanded, setDescExpanded] = useState(false);
  const isLongDesc = descText.length > 130;

  return (
    <header className="relative overflow-hidden">
      {/* ── HERO BANNER AVEC BACKGROUND IMAGE & OVERLAY MINIMALISTE ── */}
      <div className="relative isolate overflow-hidden bg-slate-900 text-white min-h-[340px] sm:min-h-[400px] flex items-center justify-center">
        {/* Image de fond bannière */}
        {banner ? (
          <img
            src={banner}
            alt={shop.name}
            className="absolute inset-0 h-full w-full object-cover object-center"
            fetchPriority="high"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950" />
        )}

        {/* Overlay léger pour contraste lisible sans noircir l'image */}
        {banner ? (
          <div className="absolute inset-0 bg-slate-950/45" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

        {/* Contenu textuel sans logo au milieu (le logo est déjà dans la navbar) */}
        <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14 text-center flex flex-col items-center space-y-3.5">
          {/* Badge Catégorie : TOUJOURS en haut, centré au-dessus du nom */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1 text-xs font-semibold text-white shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#4F46E5] animate-pulse" />
            <span>{getShopCategoryLabel(shop) || "Boutique Officielle"}</span>
          </div>

          {/* Titre Principal de la Boutique + Badge Certifié en-dessous */}
          <div className="flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap">
            <h1 className="font-shop-heading text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
              {shop.name}
            </h1>
            {isVerified && (
              <span title="Boutique certifiée MarketNet" className="inline-flex">
                <BadgeCheck className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-300 shrink-0" />
              </span>
            )}
          </div>

          {/* Description avec gestion intelligente des textes longs pour ne pas casser le Hero */}
          <div className="max-w-xl mx-auto">
            <p
              className={cn(
                "text-xs sm:text-sm md:text-base text-slate-200 leading-relaxed drop-shadow-sm transition-all duration-200",
                isLongDesc && !descExpanded && "line-clamp-2 sm:line-clamp-3"
              )}
            >
              {descText || "Votre boutique en ligne officielle. Découvrez nos produits et passez commande directement sur WhatsApp."}
            </p>
            {isLongDesc && (
              <button
                type="button"
                onClick={() => setDescExpanded(!descExpanded)}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-indigo-300 hover:text-white underline underline-offset-4 decoration-indigo-400/60 transition-colors cursor-pointer"
              >
                <span>{descExpanded ? "Réduire ↑" : "Lire la suite..."}</span>
              </button>
            )}
          </div>

          {/* Actions Clés Responsive : boutons compacts et bien taillés sur mobile */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 pt-2 flex-wrap">
            <Link
              to="/b/$slug/produits"
              params={{ slug: shop.slug }}
              className="inline-flex items-center justify-center gap-1.5 h-11 px-5 sm:px-6 rounded-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <ShoppingBag className="h-4 w-4 shrink-0" />
              <span>Voir la boutique</span>
            </Link>

            {hasWhatsapp && (
              <a
                href={`https://wa.me/${shop.whatsapp?.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Bonjour ${shop.name}, je vous contacte depuis votre boutique en ligne.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 h-11 px-4 sm:px-5 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm shadow-md transition-colors whitespace-nowrap"
              >
                <MessageCircle className="h-4 w-4 text-[#25D366] shrink-0" />
                <span className="hidden xs:inline sm:inline">WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleShare}
              title="Partager le lien"
              aria-label="Partager"
              className="grid h-11 w-11 place-items-center rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white shadow-md transition-colors cursor-pointer shrink-0"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          {/* Réseaux sociaux du commerçant configurés depuis son espace */}
          {(shop.facebook || shop.instagram || shop.tiktok) && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="text-[11px] text-slate-300 font-medium mr-1 hidden sm:inline">Suivez-nous :</span>
              {shop.instagram && (
                <a
                  href={formatSocialUrl(shop.instagram, "instagram")}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Instagram"
                  aria-label="Instagram"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white shadow-xs backdrop-blur-md transition-all hover:scale-105"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {shop.facebook && (
                <a
                  href={formatSocialUrl(shop.facebook, "facebook")}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Facebook"
                  aria-label="Facebook"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white shadow-xs backdrop-blur-md transition-all hover:scale-105"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {shop.tiktok && (
                <a
                  href={formatSocialUrl(shop.tiktok, "tiktok")}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="TikTok"
                  aria-label="TikTok"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white shadow-xs backdrop-blur-md transition-all hover:scale-105"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── CHIFFRES CLÉS ANIMÉS (Metrics Bar) ── */}
      <MetricsBar />

      {/* ── 4 BADGES DE RÉASSURANCE CLIENT ── */}
      <div className="mx-auto max-w-5xl px-4 py-5 sm:py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center shrink-0">
              <Truck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-slate-900 leading-tight">Livraison rapide</p>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Partout en RDC</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-slate-900 leading-tight">Retrait en boutique</p>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{shop.city || "Disponible sur place"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Lock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-slate-900 leading-tight">Paiement flexible</p>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Mobile Money & Cash</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
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
   1b. BARRE DE MÉTRIQUES ANIMÉES (compteur déclenché à l'entrée dans le viewport)
   ══════════════════════════════════════════════════════════════════════════ */
function MetricsBar() {
  const { sold, clients, ref } = useMetricsCounter();
  return (
    <div className="border-b border-slate-200 bg-white py-4 sm:py-5 shadow-xs">
      <div ref={ref} className="mx-auto max-w-5xl px-4 grid grid-cols-3 gap-2 sm:gap-3 text-center">
        <div>
          <span className="font-shop-heading text-lg sm:text-2xl font-extrabold text-[#4F46E5] block">
            +{sold}
          </span>
          <span className="text-[11px] sm:text-xs text-slate-500 block mt-0.5">Produits vendus</span>
        </div>
        <div className="border-x border-slate-100">
          <span className="font-shop-heading text-lg sm:text-2xl font-extrabold text-[#4F46E5] block">
            +{clients}
          </span>
          <span className="text-[11px] sm:text-xs text-slate-500 block mt-0.5">Clients satisfaits</span>
        </div>
        <div>
          <span className="font-shop-heading text-lg sm:text-2xl font-extrabold text-[#4F46E5] block">
            24 h
          </span>
          <span className="text-[11px] sm:text-xs text-slate-500 block mt-0.5">Livraison rapide</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   2. FICHE PRODUIT STANDARD (DESIGN SYSTEM MARKETNET INDIGO)
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
      <div className="p-3 sm:p-4 space-y-2 flex-1 flex flex-col justify-between">
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
    <section id="atouts" className="mt-14 pt-10 border-t border-slate-200/80">
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

/* ══════════════════════════════════════════════════════════════════════════
   4. BANDEAU TICKER DÉFILANT EN TÊTE
   ══════════════════════════════════════════════════════════════════════════ */
export function VytriniAnnouncementTicker({ shop }: { shop: any }) {
  const shopName = shop?.name || "Boutique";
  const annonces = [
    `Livraison rapide partout en RDC • Commandes directes sur WhatsApp`,
    `Catalogue officiel en ligne de ${shopName} • Prix en $ et FC`,
    `Service client réactif et assistance personnalisée`,
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((prev) => (prev + 1) % annonces.length);
    }, 4500);
    return () => clearInterval(t);
  }, [annonces.length]);

  return (
    <div
      className="w-full h-9 sm:h-10 text-white text-[11px] sm:text-xs flex items-center justify-between px-3 sm:px-4 shadow-xs select-none"
      style={{ background: "var(--shop-primary, #1E293B)" }}
    >
      <button
        type="button"
        aria-label="Annonce précédente"
        onClick={() => setIdx((prev) => (prev - 1 + annonces.length) % annonces.length)}
        className="h-full px-2 flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer transition-opacity"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>

      <div className="overflow-hidden text-center truncate px-2 font-medium">
        <span className="inline-block transition-transform duration-300">
          {annonces[idx]}
        </span>
      </div>

      <button
        type="button"
        aria-label="Annonce suivante"
        onClick={() => setIdx((prev) => (prev + 1) % annonces.length)}
        className="h-full px-2 flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer transition-opacity"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   5. FOOTER OFFICIEL SANS NUMÉRO EN CLAIR (BOUTON WHATSAPP PUR)
   ══════════════════════════════════════════════════════════════════════════ */
export function VytriniStoreFooter({ shop }: { shop: any }) {
  const name = shop?.name || "Boutique";
  const whatsappDigits = shop?.whatsapp?.replace(/\D/g, "") || "";
  const whatsappUrl = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
    `Bonjour ${name}, je souhaiterais plus d'informations.`
  )}`;

  return (
    <footer id="contact" className="mt-16 border-t border-slate-200 bg-white pt-10 pb-14 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-lg sm:text-xl text-slate-900">{name}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
              Disponibilité • Fiabilité • Performance. Commandes en direct sans intermédiaire.
            </p>
            {(shop?.city || shop?.hours) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                {shop?.city && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {shop.city}
                  </span>
                )}
                {shop?.hours && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {shop.hours}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row md:justify-end gap-3 items-start sm:items-center">
            {whatsappDigits && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm shadow-md transition-colors"
              >
                <MessageCircle className="h-4 w-4 fill-white" />
                <span>Écrire sur WhatsApp</span>
              </a>
            )}
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} {name}. Tous droits réservés.</p>
          <p>
            Boutique propulsée par{" "}
            <span className="font-bold text-[#4F46E5]">MarketNet</span> • 0% de commission
          </p>
        </div>
      </div>
    </footer>
  );
}
