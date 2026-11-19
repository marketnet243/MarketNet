import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PackageSearch,
  Search,
  X,
  Package,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Plus,
  Check,
} from "lucide-react";
import { publicShopQuery } from "@/lib/storefront.query";
import { StoreHeader, ProductCard, StoreFeaturesSection } from "@/components/store/StoreParts";
import { StoreOfflineView } from "@/components/store/StoreOfflineView";
import { PromoBanner } from "@/components/promo/PromoBanner";
import { useCart } from "@/components/store/cart";
import { cn } from "@/lib/utils";
import { absoluteMediaUrl, formatPrice, mediaUrl, type Variant } from "@/lib/marketnet";

export const Route = createFileRoute("/b/$slug/")({
  loader: ({ context, params }: any) =>
    context.queryClient.ensureQueryData(publicShopQuery(params.slug)),
  head: ({ loaderData }: any) => {
    if (!loaderData) return {};
    const { shop, products, origin } = loaderData;
    const title = `${shop.name} — Vitrine officielle & Commandes WhatsApp`;
    const desc =
      shop.description?.slice(0, 160) ||
      `Découvrez le catalogue complet de ${shop.name}${shop.city ? ` à ${shop.city}` : ""}. Commandez rapidement sur WhatsApp avec livraison directe.`;
    const shopUrl = `${origin}/b/${shop.slug}`;
    const shopCover = shop.banner_url || shop.logo_url;
    const ogImage = shopCover ? absoluteMediaUrl(shopCover, origin) : null;
    const isOffline = !shop.is_published || shop.is_suspended;

    const catalogSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Produits de ${shop.name}`,
      itemListElement: (products || []).slice(0, 15).map((p: any, i: number) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: p.name,
          description: p.description || p.name,
          image: p.image_url ? absoluteMediaUrl(p.image_url, origin) : undefined,
          offers: {
            "@type": "Offer",
            price: p.price,
            priceCurrency: shop.currency || "USD",
            availability:
              p.stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            url: `${origin}/b/${shop.slug}/p/${p.id}`,
          },
        },
      })),
    };

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "robots", content: isOffline ? "noindex, nofollow" : "index, follow, max-image-preview:large" },
        { property: "og:site_name", content: shop.name },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: shopUrl },
        ...(ogImage
          ? [
              { property: "og:image", content: ogImage },
              { property: "og:image:secure_url", content: ogImage },
              { property: "og:image:alt", content: `Boutique ${shop.name}` },
              { property: "og:image:width", content: "1200" },
              { property: "og:image:height", content: "630" },
              { name: "twitter:card", content: "summary_large_image" },
              { name: "twitter:image", content: ogImage },
            ]
          : []),
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: shopUrl }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(catalogSchema) }],
    };
  },
  component: ShopHome,
});

/* ═══════════════════════════════════════════════════════════════ */

function ShopHome() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(publicShopQuery(slug));
  const { shop, products, categories, promos } = data;
  const { add } = useCart();
  const navigate = useNavigate();

  /* ── Recherche ── */
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ── Rayon / Catégorie active ── */
  const [cat, setCat] = useState<string | null>(null);

  /* ── Placeholder animé ── */
  const [animPlaceholder, setAnimPlaceholder] = useState("");
  useEffect(() => {
    if (!products.length) return;
    const sampleNames = products.slice(0, 5).map((p) => p.name);
    let sampleIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let timer: any;

    function tick() {
      const current = sampleNames[sampleIdx] || "";
      if (!deleting) {
        charIdx++;
        setAnimPlaceholder(`Rechercher « ${current.slice(0, charIdx)} »`);
        if (charIdx >= current.length) {
          deleting = true;
          timer = setTimeout(tick, 2200);
          return;
        }
        timer = setTimeout(tick, 60);
      } else {
        charIdx--;
        setAnimPlaceholder(`Rechercher « ${current.slice(0, charIdx)} »`);
        if (charIdx <= 0) {
          deleting = false;
          sampleIdx = (sampleIdx + 1) % sampleNames.length;
          timer = setTimeout(tick, 400);
          return;
        }
        timer = setTimeout(tick, 30);
      }
    }

    timer = setTimeout(tick, 800);
    return () => clearTimeout(timer);
  }, [products]);

  /* ── Liste filtrée ── */
  const list = useMemo(
    () =>
      products.filter(
        (p) =>
          (!cat || p.category_id === cat) &&
          p.name.toLowerCase().includes(q.toLowerCase())
      ),
    [products, cat, q]
  );

  const featured = products.filter((p) => p.featured);
  const isFiltering = !!(q || cat);
  const isOffline = !shop.is_published || shop.is_suspended;

  if (isOffline) {
    return (
      <div className="min-h-screen">
        <StoreHeader shop={shop} isPublished={shop.is_published} isSuspended={shop.is_suspended} />
        <StoreOfflineView shop={shop} isSuspended={shop.is_suspended} />
      </div>
    );
  }

  function quickAdd(p: (typeof products)[0]) {
    add({ productId: p.id, name: p.name, price: Number(p.price), currency: p.currency, image: p.images[0] });
    toast.success(`« ${p.name} » ajouté au panier !`);
  }

  return (
    <div className="min-h-screen bg-slate-50/50">

      {/* ── 1. HERO HEADER 2 COLONNES (STYLE VYTRINI) ── */}
      <StoreHeader shop={shop} isPublished={shop.is_published} isSuspended={shop.is_suspended} />

      {/* ── 2. PROMOTIONS ACTIVES ── */}
      {promos && promos.length > 0 && (
        <div className="mx-auto max-w-5xl px-3 sm:px-4 pt-5">
          <PromoBanner promos={promos} slug={slug} currency={shop.currency} whatsapp={shop.whatsapp} />
        </div>
      )}

      {/* ── 3. CONTENU PRINCIPAL DE LA VITRINE ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-28">

        {/* ── SÉLECTION DU MOMENT (CAROUSEL) ── */}
        {!isFiltering && featured.length > 0 && (
          <section className="mt-8 mb-10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5]">Sélection</p>
                <h2 className="mt-0.5 font-shop-heading text-xl font-extrabold text-slate-900">Coups de cœur ✨</h2>
              </div>
              <span className="rounded-full bg-[#EEF2FF] border border-[#E0E7FF] px-2.5 py-0.5 text-xs font-bold text-[#4F46E5]">
                {featured.length}
              </span>
            </div>
            <div className="-mx-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-3 scrollbar-none">
              {featured.map((p) => (
                <div key={p.id} className="w-[170px] sm:w-[200px] shrink-0 snap-start">
                  <ProductCard
                    product={p}
                    onAdd={(p.variants as Variant[]).length ? undefined : () => quickAdd(p)}
                    href={
                      <Link
                        to="/b/$slug/p/$productId"
                        params={{ slug, productId: p.id }}
                        className="absolute inset-0"
                        aria-label={p.name}
                      />
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── ANCRE CATALOGUE ── */}
        <div id="catalogue" />

        {/* ── SECTION PRINCIPALE DES PRODUITS (STYLE VYTRINI) ── */}
        <section className="mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5]">Nos articles</p>
              <h2 className="mt-0.5 font-shop-heading text-2xl font-extrabold text-slate-900">
                Tout ce qu'on vous propose
              </h2>
            </div>
            <span className="self-start sm:self-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              {list.length} article{list.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* ── BARRE DE RECHERCHE MINIMALISTE ── */}
          <div className="relative mb-5">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#4F46E5] transition-colors pointer-events-none" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => setFocused(true)}
                placeholder={!focused && !q && animPlaceholder ? animPlaceholder : "Rechercher dans la boutique…"}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-10 text-sm shadow-xs transition-all placeholder:text-slate-400 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/15"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* ── RAYONS / CATÉGORIES (PILLS) ── */}
          {categories.length > 0 && (
            <div className="-mx-4 mb-6 flex items-center gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setCat(null)}
                className={cn(
                  "h-9 shrink-0 rounded-full px-4 text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                  !cat
                    ? "bg-[#4F46E5] text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                Tout ({products.length})
              </button>
              {categories.map((c) => {
                const count = products.filter((p) => p.category_id === c.id).length;
                const isSelected = cat === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCat(c.id)}
                    className={cn(
                      "h-9 shrink-0 rounded-full px-4 text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                      isSelected
                        ? "bg-[#4F46E5] text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {c.name} {count > 0 && `(${count})`}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── GRILLE / LISTE DE PRODUITS ── */}
          {list.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <PackageSearch className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Aucun produit trouvé</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {isFiltering
                  ? "Aucun résultat ne correspond à votre recherche. Essayez un autre terme."
                  : "Le commerçant prépare ses articles. N'hésitez pas à lui écrire sur WhatsApp !"}
              </p>
              {isFiltering && (
                <button
                  type="button"
                  onClick={() => { setQ(""); setCat(null); }}
                  className="mt-4 px-4 py-2 rounded-full bg-[#4F46E5] text-white text-xs font-bold shadow-xs hover:bg-[#4338CA] transition-colors cursor-pointer"
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {list.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAdd={(p.variants as Variant[]).length ? undefined : () => quickAdd(p)}
                  href={
                    <Link
                      to="/b/$slug/p/$productId"
                      params={{ slug, productId: p.id }}
                      className="absolute inset-0"
                      aria-label={p.name}
                    />
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* ── 4. SECTION POURQUOI CHOISIR (ATOUTS CLIENTS VYTRINI) ── */}
        <StoreFeaturesSection shopName={shop.name} />

      </div>
    </div>
  );
}
