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
  const variants = (product.variants as Variant[]) ?? [];

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

  const isDiscounted =
    (product as any).discounted_price != null &&
    (product as any).discounted_price < Number(product.price);
  const effectivePrice = isDiscounted
    ? (product as any).discounted_price
    : Number(product.price);
  const discountPct = isDiscounted
    ? Math.round((1 - effectivePrice / Number(product.price)) * 100)
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
        original_price: Number(product.price),
      },
      qty
    );
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1800);
    toast.success("Ajouté au panier 🛍️", {
      action: { label: "Voir le panier", onClick: () => setOpen(true) },
    });
  }

  const infoCardClass =
    "flex flex-col items-center gap-1 rounded-2xl bg-shop-card/60 px-3 py-3 text-center flex-1 min-w-0";

  return (
    <div
      className={cn("theme-" + shop.theme, "min-h-screen")}
      style={shopStyle(shop.primary_color)}
    >
      {/* ── Breadcrumb nav ───────────────────── */}
      <div className="sticky top-0 z-30 border-b border-current/8 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-5xl items-center gap-2 px-3 sm:px-4">
          <BackLink slug={slug} shopName={shop.name} />
          <span className="text-current/20 text-xs">/</span>
          <span className="line-clamp-1 text-xs font-semibold text-shop-fg opacity-70">
            {product.name}
          </span>
        </div>
      </div>

      {/* ── Main layout ─────────────────────── */}
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6">
        <div className="grid gap-5 md:grid-cols-2 md:items-start md:gap-10 lg:gap-14">

          {/* ── LEFT: Image gallery ─────────── */}
          <div className="space-y-2.5">
            {/* Main image */}
            <div className="relative overflow-hidden rounded-2xl bg-shop-card aspect-square shadow-md">
              {imgs[imgIdx] ? (
                <img
                  key={imgIdx}
                  src={mediaUrl(imgs[imgIdx])!}
                  alt={product.name}
                  className="h-full w-full object-cover transition-opacity duration-300"
                  loading="eager"
                />
              ) : (
                <div className="grid h-full place-items-center">
                  <Package className="h-16 w-16 opacity-20 text-shop-muted" />
                </div>
              )}

              {/* Discount badge */}
              {isDiscounted && (
                <div className="absolute left-2.5 top-2.5 rounded-full bg-destructive px-2.5 py-0.5 text-xs font-black text-primary-foreground shadow-md">
                  -{discountPct}%
                </div>
              )}

              {/* Out of stock overlay */}
              {out && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
                  <span className="rounded-full border-2 border-current/30 bg-background/90 px-4 py-1.5 text-xs font-bold tracking-normal">
                    Rupture de stock
                  </span>
                </div>
              )}

              {/* Featured badge */}
              {product.featured && !out && (
                <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-warning px-2.5 py-0.5 text-[11px] font-black text-warning shadow-md">
                  <Star className="h-3 w-3 fill-current" /> Coup de cœur
                </div>
              )}

              {/* Nav arrows (multi-image) */}
              {imgs.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIdx((i) => Math.max(0, i - 1))}
                    disabled={imgIdx === 0}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-background/80 shadow-md backdrop-blur-sm transition-all hover:bg-background disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setImgIdx((i) => Math.min(imgs.length - 1, i + 1))}
                    disabled={imgIdx === imgs.length - 1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-background/80 shadow-md backdrop-blur-sm transition-all hover:bg-background disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* Dot indicator */}
              {imgs.length > 1 && (
                <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {imgs.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        i === imgIdx ? "w-4 bg-shop" : "w-1.5 bg-current/30 hover:bg-current/50"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {imgs.length > 1 && (
              <div
                ref={thumbnailRef}
                className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {imgs.map((im, i) => (
                  <button
                    key={im}
                    onClick={() => setImgIdx(i)}
                    className={cn(
                      "h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200",
                      i === imgIdx
                        ? "border-shop ring-2 ring-shop/30 shadow-sm scale-105"
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={mediaUrl(im)!} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Trust row — desktop below image */}
            <div className="hidden md:flex gap-2">
              {[
                { icon: <Truck className="h-4 w-4 text-shop" />, label: "Livraison rapide" },
                { icon: <ShieldCheck className="h-4 w-4 text-shop" />, label: "Paiement sécurisé" },
                { icon: <MessageCircle className="h-4 w-4 text-shop" />, label: "Support WhatsApp" },
              ].map((b) => (
                <div key={b.label} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-current/10 bg-shop-card/60 px-2 py-2.5 text-center">
                  {b.icon}
                  <span className="text-[11px] font-semibold text-shop-fg/80">{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Product info ──────────── */}
          <div className="space-y-4">
            {/* Category + actions row */}
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-shop/10 px-2.5 py-1 text-[11px] font-bold text-shop">
                {product.category_id
                  ? ((data as any).categories?.find((c: any) => c.id === product.category_id)?.name ?? "Produit")
                  : "Produit"}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setLiked((v) => !v)}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-xl border border-current/15 transition-all duration-200",
                    liked ? "bg-destructive border-destructive text-destructive" : "bg-shop-card/60 text-shop-muted hover:border-current/30"
                  )}
                  aria-label="Favoris"
                >
                  <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} />
                </button>
                <button
                  onClick={handleShare}
                  className="grid h-8 w-8 place-items-center rounded-xl border border-current/15 bg-shop-card/60 text-shop-muted transition-all hover:border-current/30"
                  aria-label="Partager"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Product name */}
            <div>
              <h1 className="font-shop-heading text-xl font-extrabold leading-tight sm:text-2xl">
                {product.name}
              </h1>
              <div className="mt-1.5 flex items-center gap-1.5">
                {shop.logo_url ? (
                  <img src={mediaUrl(shop.logo_url)!} alt={shop.name} className="h-4 w-4 rounded-full object-cover ring-1 ring-current/10" />
                ) : (
                  <BadgeCheck className="h-4 w-4 text-shop" />
                )}
                <span className="text-xs text-shop-muted">
                  Vendu par <span className="font-semibold text-shop-fg">{shop.name}</span>
                </span>
              </div>
            </div>

            {/* ── Price block ─────────────────── */}
            <div className="rounded-xl bg-shop-card/60 p-3.5 border border-current/8">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className={cn("text-2xl font-black", isDiscounted ? "text-destructive dark:text-destructive" : "text-shop")}>
                  {priceStr}
                </span>
                {isDiscounted && (
                  <>
                    <span className="text-sm text-shop-muted line-through">
                      {formatPrice(Number(product.price), product.currency)}
                    </span>
                    <span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-black text-destructive dark:bg-destructive/40 dark:text-destructive">
                      -{discountPct}%
                    </span>
                  </>
                )}
              </div>
              {(product as any).promo_ends_at && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-shop-muted">
                  <Clock className="h-3 w-3 text-warning" />
                  Offre jusqu'au{" "}
                  <span className="font-semibold text-warning">
                    {new Date((product as any).promo_ends_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                  </span>
                </div>
              )}
              <div className="mt-2.5">
                {out ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-current/10 px-2.5 py-0.5 text-xs font-semibold text-shop-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-current/40" />
                    Rupture de stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success px-2.5 py-0.5 text-xs font-semibold text-success dark:bg-success/30 dark:text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    En stock — livraison disponible
                  </span>
                )}
              </div>
            </div>

            {/* ── Description ─────────────────── */}
            {product.description && (
              <div>
                <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-normal text-shop-muted">
                  Description
                </h3>
                <div className={cn(
                  "relative overflow-hidden whitespace-pre-line text-sm leading-relaxed text-shop-fg/80 transition-all duration-500",
                  !expanded && descLong ? "max-h-20" : "max-h-[800px]"
                )}>
                  {product.description}
                  {!expanded && descLong && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
                  )}
                </div>
                {descLong && (
                  <button onClick={() => setExpanded((v) => !v)} className="mt-1 text-xs font-semibold text-shop hover:underline">
                    {expanded ? "Voir moins ↑" : "Voir plus ↓"}
                  </button>
                )}
              </div>
            )}

            {/* ── Variants ────────────────────── */}
            {variants.map((v) => (
              <div key={v.name}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-normal text-shop-muted">{v.name}</h3>
                  {choice[v.name] && (
                    <span className="rounded-full bg-shop/10 px-2 py-0.5 text-xs font-bold text-shop">{choice[v.name]}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {v.options.map((o) => (
                    <button
                      key={o}
                      onClick={() => setChoice((c) => ({ ...c, [v.name]: o }))}
                      className={cn(
                        "h-9 min-w-12 rounded-xl border-2 px-3 text-sm font-semibold transition-all duration-200 ",
                        choice[v.name] === o
                          ? "border-shop bg-shop text-shop-foreground shadow-sm"
                          : "border-current/15 bg-shop-card/60 hover:border-shop/50"
                      )}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* ── Quantité + Ajouter ──────────── */}
            {!out && (
              <div className="space-y-3">
                {/* Qty */}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-normal text-shop-muted">Quantité</span>
                  <div className="flex items-center rounded-full border-2 border-current/15 bg-shop-card/60">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-9 w-9 place-items-center rounded-full text-shop-muted hover:text-shop-fg " aria-label="Moins">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-black">{qty}</span>
                    <button onClick={() => setQty((q) => Math.min(99, q + 1))} className="grid h-9 w-9 place-items-center rounded-full text-shop-muted hover:text-shop-fg " aria-label="Plus">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {qty > 1 && (
                    <span className="text-xs text-shop-muted">
                      Total : <span className="font-bold text-shop">{formatPrice(effectivePrice * qty, product.currency)}</span>
                    </span>
                  )}
                </div>

                {/* CTA buttons */}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={addToCart}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-md transition-all duration-200  bg-shop text-shop-foreground hover:opacity-90",
                      addedAnim && "scale-95 opacity-80"
                    )}
                  >
                    {addedAnim ? (
                      <><CheckCircle2 className="h-4 w-4" /> Ajouté !</>
                    ) : (
                      <><ShoppingBag className="h-4 w-4" /> Ajouter au panier</>
                    )}
                  </button>

                  {shop.whatsapp && (
                    <a
                      href={buildWhatsAppUrl(shop.whatsapp, product.name, priceStr, shop.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-success px-5 py-3 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-success "
                    >
                      <MessageCircle className="h-4 w-4" />
                      Commander WhatsApp
                    </a>
                  )}
                </div>

                <p className="text-center text-[11px] text-shop-muted">
                  Paiement et livraison convenus directement avec le vendeur
                </p>
              </div>
            )}

            {/* Trust row mobile */}
            <div className="flex gap-2 md:hidden">
              {[
                { icon: <Truck className="h-4 w-4 text-shop" />, label: "Livraison" },
                { icon: <ShieldCheck className="h-4 w-4 text-shop" />, label: "Sécurisé" },
                { icon: <MessageCircle className="h-4 w-4 text-shop" />, label: "WhatsApp" },
              ].map((b) => (
                <div key={b.label} className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-current/10 bg-shop-card/60 py-2.5">
                  {b.icon}
                  <span className="text-[10px] font-semibold text-shop-fg/70">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Autres articles ─────────── */}
        {data.products.filter((p) => p.id !== productId).length > 0 && (
          <section className="mt-10 md:mt-14">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-normal text-shop/60">Boutique</p>
                <h2 className="mt-0.5 font-shop-heading text-lg font-extrabold">Autres articles</h2>
              </div>
              <Link to="/b/$slug" params={{ slug }} className="flex items-center gap-1 text-xs font-bold text-shop hover:underline">
                Voir tout <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-3 sm:-mx-4 sm:px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {data.products
                .filter((p) => p.id !== productId)
                .slice(0, 8)
                .map((p) => {
                  const pDisc = (p as any).discounted_price != null && (p as any).discounted_price < Number(p.price);
                  const pPrice = pDisc ? (p as any).discounted_price : Number(p.price);
                  return (
                    <Link key={p.id} to="/b/$slug/p/$productId" params={{ slug, productId: p.id }} className="group w-[140px] shrink-0 snap-start sm:w-[165px]">
                      <div className="overflow-hidden rounded-2xl bg-shop-card shadow-xs transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-0.5">
                        <div className="aspect-square overflow-hidden bg-shop-card/50">
                          {p.images[0] ? (
                            <img src={mediaUrl(p.images[0])!} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 " />
                          ) : (
                            <div className="grid h-full place-items-center">
                              <Package className="h-6 w-6 opacity-20" />
                            </div>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="line-clamp-2 text-xs font-semibold leading-snug">{p.name}</p>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className={cn("text-sm font-black", pDisc && "text-destructive")}>{formatPrice(pPrice, p.currency)}</span>
                            {pDisc && <span className="text-[11px] line-through text-shop-muted">{formatPrice(Number(p.price), p.currency)}</span>}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </section>
        )}
      </div>

      {/* ── Sticky Bottom CTA mobile ───────── */}
      {!out && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-current/10 bg-background/95 px-4 pb-5 pt-3 backdrop-blur-md md:hidden">
          <div className="mx-auto flex max-w-sm items-center gap-3">
            <div className="flex flex-col justify-center">
              <span className="text-[10px] text-shop-muted">Prix</span>
              <span className={cn("text-base font-black leading-tight", isDiscounted ? "text-destructive dark:text-destructive" : "text-shop")}>
                {priceStr}
              </span>
            </div>
            <button
              onClick={addToCart}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl bg-shop py-2.5 text-sm font-bold text-shop-foreground shadow-soft transition-all ",
                addedAnim && "scale-95 opacity-80"
              )}
            >
              {addedAnim ? <><CheckCircle2 className="h-4 w-4" /> Ajouté !</> : <><ShoppingBag className="h-4 w-4" /> Ajouter au panier</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BackLink({ slug, shopName }: { slug: string; shopName: string }) {
  return (
    <Link
      to="/b/$slug"
      params={{ slug }}
      className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm font-semibold text-shop-muted transition-colors hover:bg-shop-card/60 hover:text-shop-fg"
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="max-w-[120px] truncate sm:max-w-none">{shopName}</span>
    </Link>
  );
}
