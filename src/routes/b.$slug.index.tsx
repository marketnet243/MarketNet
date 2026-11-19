import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  PackageSearch,
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

  const featured = products.filter((p) => p.featured);
  const isOffline = !shop.is_published || shop.is_suspended;

  // Affichage des 6 premiers produits sur l'accueil
  const homeProducts = useMemo(() => products.slice(0, 6), [products]);

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
  }

  return (
    <div className="min-h-screen bg-[#f4f8fa]">

      {/* ── 1. HERO HEADER AVEC BANNIÈRE EN BACKGROUND & OVERLAY ── */}
      <StoreHeader shop={shop} isPublished={shop.is_published} isSuspended={shop.is_suspended} />

      {/* ── 2. PROMOTIONS ACTIVES ── */}
      {promos && promos.length > 0 && (
        <div className="mx-auto max-w-5xl px-3 sm:px-4 pt-5">
          <PromoBanner promos={promos} slug={slug} currency={shop.currency} whatsapp={shop.whatsapp} />
        </div>
      )}

      {/* ── 3. CONTENU PRINCIPAL DE L'ACCUEIL ── */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-28">

        {/* ── SÉLECTION DU MOMENT (CAROUSEL) ── */}
        {featured.length > 0 && (
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

        {/* ── SECTION PRODUITS VEDETTES (6 PRODUITS MAX SUR L'ACCUEIL) ── */}
        <section id="catalogue" className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5]">Nos articles</p>
              <h2 className="mt-0.5 font-shop-heading text-2xl font-extrabold text-slate-900">
                Tout ce qu'on vous propose
              </h2>
            </div>
            <span className="self-start sm:self-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              {products.length} article{products.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* ── GRILLE DES 6 ARTICLES ── */}
          {products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <PackageSearch className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Aucun produit disponible</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Le commerçant prépare ses articles. N'hésitez pas à lui écrire sur WhatsApp !
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {homeProducts.map((p) => (
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

              {/* ── BOUTON EXPLORER TOUS NOS PRODUITS ── */}
              <div className="mt-8 text-center">
                <Link
                  to="/b/$slug/produits"
                  params={{ slug }}
                  className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  <span>Explorer tous nos produits ({products.length})</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </>
          )}
        </section>

        {/* ── 4. SECTION POURQUOI CHOISIR (ATOUTS CLIENTS VYTRINI) ── */}
        <StoreFeaturesSection shopName={shop.name} />

      </div>
    </div>
  );
}
