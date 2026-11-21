import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Package,
  MessageCircle,
  Share2,
  Star,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Heart,
  Tag,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { publicShopQuery } from "@/lib/storefront.query";
import { useCart } from "@/components/store/cart";
import { StoreOfflineView } from "@/components/store/StoreOfflineView";
import { absoluteMediaUrl, formatPrice, mediaUrl, shopStyle, type Variant } from "@/lib/marketnet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/b/$slug/p/$productId")({
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(publicShopQuery(params.slug));
    const product = d.products.find((p) => p.id === params.productId);
    if (!product) throw notFound();
    return { product, shop: d.shop, origin: d.origin };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return { meta: [{ title: "Produit introuvable" }, { name: "robots", content: "noindex" }] };
    const { product, shop, origin } = loaderData;
    const title = `${product.name} — ${formatPrice(Number(product.price), product.currency)} | ${shop.name}`;
    const desc =
      product.description?.slice(0, 160) ||
      `Commandez ${product.name} chez ${shop.name} directement sur WhatsApp. Livraison rapide${shop.city ? ` à ${shop.city}` : ""}.`;
    const productUrl = `${origin}/b/${shop.slug}/p/${product.id}`;
    const shopCover = shop.banner_url || shop.logo_url;
    const coverPath = product.images?.[0] || shopCover;
    const ogImage = coverPath ? absoluteMediaUrl(coverPath, origin) : null;
    const isDiscounted =
      (product as any).discounted_price != null &&
      (product as any).discounted_price < Number(product.price);
    const effectivePrice = isDiscounted
      ? (product as any).discounted_price
      : Number(product.price);

    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: desc,
      image: ogImage ? [ogImage] : [],
      url: productUrl,
      sku: product.id,
      offers: {
        "@type": "Offer",
        url: productUrl,
        priceCurrency: product.currency || "USD",
        price: effectivePrice,
        availability:
          product.status === "out_of_stock"
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
        seller: {
          "@type": "Organization",
          name: shop.name,
        },
      },
      brand: {
        "@type": "Brand",
        name: shop.name,
      },
    };

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "robots", content: "index, follow, max-image-preview:large" },
        { property: "og:site_name", content: shop.name },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: productUrl },
        { property: "product:price:amount", content: String(effectivePrice) },
        { property: "product:price:currency", content: product.currency || "USD" },
        ...(ogImage
          ? [
              { property: "og:image", content: ogImage },
              { property: "og:image:secure_url", content: ogImage },
              { property: "og:image:alt", content: product.name },
              { property: "og:image:width", content: "1200" },
              { property: "og:image:height", content: "630" },
              { name: "twitter:card", content: "summary_large_image" },
              { name: "twitter:image", content: ogImage },
            ]
          : []),
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: productUrl }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(productSchema),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-3xl bg-current/5">
        <Package className="h-10 w-10 opacity-30" />
      </div>
      <h2 className="text-xl font-bold">Produit introuvable</h2>
      <p className="text-sm text-shop-muted">Ce produit n'existe pas ou a été supprimé.</p>
    </div>
  ),
  component: ProductPage,
});

/* ─── helpers ───────────────────────────────────────────────── */
function buildWhatsAppUrl(whatsapp: string, productName: string, price: string, shopName: string) {
  const msg = encodeURIComponent(
    `Bonjour ${shopName} 👋\n\nJe suis intéressé(e) par :\n*${productName}*\nPrix : ${price}\n\nPouvez-vous me donner plus d'informations ?`
  );
  const num = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${num}?text=${msg}`;
}

/* ─── Component ─────────────────────────────────────────────── */
function ProductPage() {
  const { slug, productId } = Route.useParams();
  const { data } = useSuspenseQuery(publicShopQuery(slug));
  const product = data.products.find((p) => p.id === productId)!;
  const { shop } = data;
  const rawVariants = Array.isArray(product.variants) ? (product.variants as any[]) : [];
  const variants = rawVariants.filter((v) => v && !v._meta && v.name);

  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  const { add, setOpen } = useCart();

  const out = product.status === "out_of_stock";
  const imgs = product.images.length ? product.images : [];

  // Helper lecture option label et prix spécifique optionnel
  const getOptLabel = (o: any) => (typeof o === "object" && o ? o.name || o.label || "" : String(o));
  const getOptPrice = (o: any): number | null => (typeof o === "object" && o && o.price != null && !isNaN(Number(o.price)) ? Number(o.price) : null);

  // Vérifier si une option sélectionnée a un prix spécifique propre
  let variantSpecificPrice: number | null = null;
  for (const v of variants) {
    const sel = choice[v.name];
    if (sel && Array.isArray(v.options)) {
      const match = v.options.find((o: any) => getOptLabel(o) === sel);
      const p = getOptPrice(match);
      if (p !== null) variantSpecificPrice = p;
    }
  }

  const basePrice = Number(product.price);
  const productOriginalPrice = Number((product as any).original_price || basePrice);
  const hasPromoOrComparePrice =
    ((product as any).discounted_price != null && (product as any).discounted_price < productOriginalPrice) ||
    productOriginalPrice > basePrice;

  // Calcul du prix effectif selon variante ou réduction
  const effectivePrice = variantSpecificPrice !== null
    ? variantSpecificPrice
    : ((product as any).discounted_price != null ? Number((product as any).discounted_price) : basePrice);

  const displayOriginalPrice = productOriginalPrice > effectivePrice ? productOriginalPrice : null;
  const isDiscounted = displayOriginalPrice !== null && displayOriginalPrice > effectivePrice;
  const discountPct = isDiscounted
    ? Math.round(((displayOriginalPrice - effectivePrice) / displayOriginalPrice) * 100)
    : 0;

  const priceStr = formatPrice(effectivePrice, product.currency);
  const descLong = (product.description?.length ?? 0) > 220;

  /* scroll thumbnail into view */
  useEffect(() => {
    if (!thumbnailRef.current) return;
    const btn = thumbnailRef.current.children[imgIdx] as HTMLElement | undefined;
    btn?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [imgIdx]);

  /* share */
  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product.name, text: priceStr, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié !");
    }
  }

  if (!data.shop.is_published || data.shop.is_suspended) {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <BackLink slug={slug} shopName={shop.name} />
        <StoreOfflineView shop={data.shop} isSuspended={data.shop.is_suspended} />
      </div>
    );
  }

  function addToCart() {
    const missing = variants.find((v) => !choice[v.name]);
    if (missing) return toast.error(`Choisissez : ${missing.name}`);
    add(
      {
        productId: product.id,
        name: product.name,
        price: effectivePrice,
        currency: product.currency,
        image: product.images[0],
        variant: variants.map((v) => `${v.name}: ${choice[v.name]}`).join(", ") || undefined,
        promo_id: (product as any).promo_id,
        original_price: displayOriginalPrice || Number(product.price),
      },
      qty
    );
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1800);
    toast.success("Ajouté au panier 🛍️", {
      action: { label: "Voir le panier", onClick: () => setOpen(true) },
    });
  }

  return (
    <div
      className={cn("theme-" + shop.theme, "min-h-screen text-slate-800 pb-16")}
      style={shopStyle(shop.primary_color || "#4F46E5")}
    >
      {/* ── BREADCRUMB / FIL D'ARIANE NATUREL DANS LE FLUX DE LA PAGE ── */}
      <div className="mx-auto max-w-5xl px-4 pt-2 pb-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            to="/b/$slug"
            params={{ slug }}
            className="hover:text-[#4F46E5] transition-colors font-medium"
          >
            Accueil
          </Link>
          <span className="text-slate-300">/</span>
          <Link
            to="/b/$slug/produits"
            params={{ slug }}
            className="hover:text-[#4F46E5] transition-colors font-medium"
          >
            Produits
          </Link>
          <span className="text-slate-300">/</span>
          <span className="truncate max-w-[140px] sm:max-w-xs font-semibold text-slate-900">
            {product.name}
          </span>
        </div>
      </div>

      {/* ── CONTENU PRINCIPAL EN 2 COLONNES HARMONIEUSES ── */}
      <div className="mx-auto max-w-5xl px-4 py-2 sm:py-4">
        <div className="grid gap-8 md:grid-cols-2 md:items-start lg:gap-12">

          {/* ── COLONNE GAUCHE : GALERIE PRODUIT ULTRA SOIGNÉE ── */}
          <div className="space-y-3.5">
            {/* Cadre de l'image principale */}
            <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 aspect-square shadow-sm flex items-center justify-center">
              {imgs[imgIdx] ? (
                <img
                  key={imgIdx}
                  src={mediaUrl(imgs[imgIdx])!}
                  alt={product.name}
                  className="h-full w-full object-cover object-center transition-all duration-300"
                  fetchPriority="high"
                />
              ) : (
                <div className="grid h-full place-items-center text-slate-300">
                  <Package className="h-16 w-16 opacity-30" />
                </div>
              )}

              {/* Badges sur l'image */}
              {isDiscounted && (
                <div className="absolute left-3.5 top-3.5 rounded-full bg-rose-500 px-3 py-1 text-xs font-black text-white shadow-md">
                  -{discountPct}%
                </div>
              )}

              {out && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs">
                  <span className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-slate-900 shadow-lg">
                    Rupture de stock
                  </span>
                </div>
              )}

              {product.featured && !out && (
                <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-white shadow-md">
                  <Star className="h-3.5 w-3.5 fill-current" /> Coup de cœur
                </div>
              )}

              {/* Flèches de navigation multi-images */}
              {imgs.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setImgIdx((i) => Math.max(0, i - 1))}
                    disabled={imgIdx === 0}
                    aria-label="Image précédente"
                    className="absolute left-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-md text-slate-800 hover:bg-white disabled:opacity-30 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImgIdx((i) => Math.min(imgs.length - 1, i + 1))}
                    disabled={imgIdx === imgs.length - 1}
                    aria-label="Image suivante"
                    className="absolute right-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-md text-slate-800 hover:bg-white disabled:opacity-30 transition-all cursor-pointer"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Miniatures d'images */}
            {imgs.length > 1 && (
              <div
                ref={thumbnailRef}
                className="flex gap-2.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {imgs.map((im: string, i: number) => (
                  <button
                    key={im}
                    type="button"
                    onClick={() => setImgIdx(i)}
                    className={cn(
                      "h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 transition-all duration-200 cursor-pointer",
                      i === imgIdx
                        ? "border-[#4F46E5] ring-2 ring-[#4F46E5]/25 shadow-sm scale-102"
                        : "border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300"
                    )}
                  >
                    <img src={mediaUrl(im)!} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Blocs de réassurance (Desktop) */}
            <div className="hidden md:grid grid-cols-3 gap-3 pt-2">
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white border border-slate-200/80 text-center shadow-2xs">
                <div className="h-8 w-8 rounded-full bg-[#EEF2FF] grid place-items-center text-[#4F46E5]">
                  <Truck className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Livraison rapide</span>
                <span className="text-[10px] text-slate-500">Partout en RDC</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white border border-slate-200/80 text-center shadow-2xs">
                <div className="h-8 w-8 rounded-full bg-[#EEF2FF] grid place-items-center text-[#4F46E5]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Paiement sécurisé</span>
                <span className="text-[10px] text-slate-500">À la réception</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white border border-slate-200/80 text-center shadow-2xs">
                <div className="h-8 w-8 rounded-full bg-[#EEF2FF] grid place-items-center text-[#4F46E5]">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Support réactif</span>
                <span className="text-[10px] text-slate-500">Direct WhatsApp</span>
              </div>
            </div>
          </div>

          {/* ── COLONNE DROITE : DÉTAILS, PRIX & COMMANDES ── */}
          <div className="space-y-5">
            {/* En-tête produit : Catégorie & Partage */}
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-bold text-[#4F46E5]">
                {product.category_id
                  ? ((data as any).categories?.find((c: any) => c.id === product.category_id)?.name ?? "Article")
                  : "Article"}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLiked((v) => !v)}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-full border transition-all cursor-pointer",
                    liked
                      ? "bg-rose-50 border-rose-200 text-rose-500"
                      : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  )}
                  aria-label="Ajouter aux favoris"
                >
                  <Heart className={cn("h-4 w-4", liked && "fill-current")} />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
                  aria-label="Partager ce produit"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Titre & Info vendeur */}
            <div>
              <h1 className="font-shop-heading text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                {product.name}
              </h1>
              <div className="mt-2 flex items-center gap-2">
                {shop.logo_url ? (
                  <img
                    src={mediaUrl(shop.logo_url)!}
                    alt={shop.name}
                    className="h-5 w-5 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <BadgeCheck className="h-5 w-5 text-[#4F46E5]" />
                )}
                <span className="text-xs text-slate-500">
                  Vendu par <span className="font-bold text-slate-800">{shop.name}</span>
                </span>
              </div>
            </div>

            {/* Bloc Prix & Disponibilité */}
            <div className="rounded-3xl bg-white p-5 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className={cn("text-3xl sm:text-4xl font-black tracking-tight", isDiscounted ? "text-rose-600" : "text-[#4F46E5]")}>
                  {priceStr}
                </span>
                {isDiscounted && displayOriginalPrice && (
                  <div className="flex items-center gap-2">
                    <span className="text-base text-slate-400 line-through">
                      {formatPrice(displayOriginalPrice, product.currency)}
                    </span>
                    <span className="rounded-full bg-rose-100 text-rose-700 px-2.5 py-0.5 text-xs font-black">
                      Économisez {discountPct}%
                    </span>
                  </div>
                )}
              </div>

              {/* Statut Stock */}
              <div className="pt-1">
                {out ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    Rupture de stock momentanée
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    En stock • Disponible immédiatement
                  </span>
                )}
              </div>
            </div>

            {/* Description Produit avec "Voir plus" fluide */}
            {product.description && (
              <div className="rounded-3xl bg-white p-5 border border-slate-200/90 shadow-xs space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Description du produit
                </h3>
                <div
                  className={cn(
                    "relative overflow-hidden whitespace-pre-line text-sm leading-relaxed text-slate-700 transition-all duration-300",
                    !expanded && descLong ? "max-h-24" : "max-h-[1000px]"
                  )}
                >
                  {product.description}
                  {!expanded && descLong && (
                    <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                  )}
                </div>
                {descLong && (
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#4F46E5] hover:underline pt-1 cursor-pointer"
                  >
                    <span>{expanded ? "Voir moins ↑" : "Voir plus ↓"}</span>
                  </button>
                )}
              </div>
            )}

            {/* Variantes (Tailles, Couleurs, etc.) */}
            {variants.map((v) => (
              <div key={v.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{v.name}</span>
                  {choice[v.name] && (
                    <span className="text-xs font-bold text-[#4F46E5]">{choice[v.name]}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(v.options) ? v.options : []).map((o: any) => {
                    const label = getOptLabel(o);
                    const optPrice = getOptPrice(o);
                    const isSelected = choice[v.name] === label;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setChoice((c) => {
                          if (c[v.name] === label) {
                            const next = { ...c };
                            delete next[v.name];
                            return next;
                          }
                          return { ...c, [v.name]: label };
                        })}
                        className={cn(
                          "h-10 px-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-2",
                          isSelected
                            ? "border-[#4F46E5] bg-[#EEF2FF] text-[#4F46E5] shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <span>{label}</span>
                        {optPrice !== null && (
                          <span
                            className={cn(
                              "text-[10px] font-semibold px-1.5 py-0.5 rounded-md",
                              isSelected
                                ? "bg-[#4F46E5]/15 text-[#4F46E5]"
                                : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {formatPrice(optPrice, product.currency)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quantité & Actions d'achat */}
            {!out && (
              <div className="space-y-4 pt-1">
                {/* Sélecteur de Quantité */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Quantité :</span>
                  <div className="flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="h-9 w-9 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 grid place-items-center transition-colors cursor-pointer"
                      aria-label="Moins"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center text-base font-extrabold text-slate-900">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.min(99, q + 1))}
                      className="h-9 w-9 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 grid place-items-center transition-colors cursor-pointer"
                      aria-label="Plus"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {qty > 1 && (
                    <span className="text-xs text-slate-500">
                      Total : <strong className="text-[#4F46E5] text-sm">{formatPrice(effectivePrice * qty, product.currency)}</strong>
                    </span>
                  )}
                </div>

                {/* Boutons d'Action Harmonieux aux Couleurs MarketNet (Agrandis & Confortables) */}
                <div className="grid w-full grid-cols-1 gap-2.5 pt-1 sm:flex sm:flex-row sm:gap-3">
                  <button
                    type="button"
                    onClick={addToCart}
                    className={cn(
                      "flex h-12 w-full items-center justify-center gap-2 rounded-xl px-3 bg-[#4F46E5] hover:bg-[#4338CA] active:scale-[0.99] text-white font-extrabold text-[13px] sm:h-14 sm:flex-1 sm:rounded-2xl sm:px-6 sm:text-base sm:gap-3 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer",
                      addedAnim && "scale-95 bg-emerald-600"
                    )}
                  >
                    {addedAnim ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
                        <span>Ajouté avec succès !</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
                        <span>Ajouter au panier</span>
                      </>
                    )}
                  </button>

                  {shop.whatsapp && (
                    <a
                      href={buildWhatsAppUrl(shop.whatsapp, product.name, priceStr, shop.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl px-3 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.99] text-white font-extrabold text-[13px] sm:h-14 sm:flex-1 sm:rounded-2xl sm:px-6 sm:text-base sm:gap-3 shadow-lg shadow-emerald-500/25 transition-all"
                    >
                      <MessageCircle className="h-5 w-5 shrink-0 fill-current sm:h-6 sm:w-6" />
                      <span className="whitespace-nowrap">Commander sur WhatsApp</span>
                    </a>
                  )}
                </div>

                <p className="text-center text-[11px] text-slate-500">
                  Commandez en toute confiance • Assistance directe avec le commerçant
                </p>
              </div>
            )}

            {/* Réassurance sur Mobile */}
            <div className="grid grid-cols-3 gap-2 md:hidden pt-2">
              <div className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-white border border-slate-200/80 text-center shadow-2xs">
                <Truck className="h-4 w-4 text-[#4F46E5]" />
                <span className="text-[11px] font-bold text-slate-800">Livraison</span>
                <span className="text-[9px] text-slate-500">Partout en RDC</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-white border border-slate-200/80 text-center shadow-2xs">
                <ShieldCheck className="h-4 w-4 text-[#4F46E5]" />
                <span className="text-[11px] font-bold text-slate-800">Sécurisé</span>
                <span className="text-[9px] text-slate-500">À la réception</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-white border border-slate-200/80 text-center shadow-2xs">
                <MessageCircle className="h-4 w-4 text-[#4F46E5]" />
                <span className="text-[11px] font-bold text-slate-800">WhatsApp</span>
                <span className="text-[9px] text-slate-500">Réponse rapide</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── AUTRES PRODUITS DE LA BOUTIQUE ── */}
        {data.products.filter((p: any) => p.id !== productId).length > 0 && (
          <section className="mt-14 sm:mt-18 pt-8 border-t border-slate-200/80">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5]">Dans la même boutique</p>
                <h2 className="font-shop-heading text-lg sm:text-xl font-extrabold text-slate-900">
                  Ces articles pourraient vous plaire
                </h2>
              </div>
              <Link
                to="/b/$slug/produits"
                params={{ slug }}
                className="flex items-center gap-1 text-xs font-bold text-[#4F46E5] hover:underline"
              >
                <span>Voir tout le catalogue</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {data.products
                .filter((p: any) => p.id !== productId)
                .slice(0, 4)
                .map((p: any) => {
                  const pDisc = (p as any).discounted_price != null && (p as any).discounted_price < Number(p.price);
                  const pPrice = pDisc ? (p as any).discounted_price : Number(p.price);
                  return (
                    <Link
                      key={p.id}
                      to="/b/$slug/p/$productId"
                      params={{ slug, productId: p.id }}
                      className="group rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col"
                    >
                      <div className="aspect-square bg-slate-50 overflow-hidden relative">
                        {p.images[0] ? (
                          <img
                            src={mediaUrl(p.images[0])!}
                            alt={p.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-slate-300">
                            <Package className="h-8 w-8" />
                          </div>
                        )}
                        {pDisc && (
                          <span className="absolute top-2 left-2 rounded-full bg-rose-500 text-white text-[10px] font-black px-2 py-0.5">
                            Promo
                          </span>
                        )}
                      </div>
                      <div className="p-3.5 flex flex-col flex-1 justify-between">
                        <p className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-[#4F46E5] transition-colors">
                          {p.name}
                        </p>
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className={cn("text-xs sm:text-sm font-extrabold", pDisc ? "text-rose-600" : "text-[#4F46E5]")}>
                            {formatPrice(pPrice, p.currency)}
                          </span>
                          {pDisc && (
                            <span className="text-[10px] text-slate-400 line-through">
                              {formatPrice(Number(p.price), p.currency)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function BackLink({ slug, shopName }: { slug: string; shopName: string }) {
  return (
    <Link
      to="/b/$slug"
      params={{ slug }}
      className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      <span className="max-w-[140px] truncate sm:max-w-none">{shopName}</span>
    </Link>
  );
}
