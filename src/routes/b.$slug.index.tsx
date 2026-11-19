import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PackageSearch,
  Search,
  X,
  Package,
  ShoppingBag,
} from "lucide-react";
import { publicShopQuery } from "@/lib/storefront.query";
import { StoreHeader, ProductCard } from "@/components/store/StoreParts";
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
    const title = `${shop.name} — Catalogue en ligne & Commandes WhatsApp`;
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
  const [cat, setCat] = useState<string | null>(null);
  const [animPlaceholder, setAnimPlaceholder] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* Typewriter placeholder */
  useEffect(() => {
    if (products.length === 0) return;
    const names = products.slice(0, 5).map((p) => p.name);
    let ni = 0, ci = 0, del = false;
    let t: ReturnType<typeof setTimeout>;
    function tick() {
      const name = names[ni % names.length];
      if (!del) {
        ci++;
        setAnimPlaceholder("Rechercher " + name.slice(0, ci) + "|");
        if (ci >= name.length) { del = true; t = setTimeout(tick, 2200); }
        else t = setTimeout(tick, 90);
      } else {
        ci--;
        setAnimPlaceholder(ci > 0 ? "Rechercher " + name.slice(0, ci) + "|" : "");
        if (ci <= 0) { del = false; ni++; t = setTimeout(tick, 700); }
        else t = setTimeout(tick, 45);
      }
    }
    t = setTimeout(tick, 1200);
    return () => clearTimeout(t);
  }, [products.length]); // eslint-disable-line

  const suggestions = useMemo(() => {
    if (!q.trim() || q.length < 2) return [];
    const low = q.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(low) ||
          p.description?.toLowerCase().includes(low)
      )
      .slice(0, 6);
  }, [q, products]);

  const showDropdown = focused && suggestions.length > 0;
  const closeDropdown = useCallback(() => { setFocused(false); setActiveIdx(-1); }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node) && !inputRef.current?.contains(e.target as Node))
        closeDropdown();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [closeDropdown]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      const p = suggestions[activeIdx];
      setQ(p.name); closeDropdown();
      navigate({ to: "/b/$slug/p/$productId", params: { slug, productId: p.id } });
    } else if (e.key === "Escape") closeDropdown();
  }

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
        <div id="about" />
        <StoreHeader shop={shop} isPublished={shop.is_published} isSuspended={shop.is_suspended} />
        <StoreOfflineView shop={shop} isSuspended={shop.is_suspended} />
      </div>
    );
  }

  function quickAdd(p: (typeof products)[0]) {
    add({ productId: p.id, name: p.name, price: Number(p.price), currency: p.currency, image: p.images[0] });
  }

  return (
    <div className="min-h-screen">

      {/* Ancre navigation menu burger */}
      <div id="about" />

      {/* ── STORE HEADER (banner, logo, description, trust badges) ── */}
      <StoreHeader shop={shop} isPublished={shop.is_published} isSuspended={shop.is_suspended} />

      {/* Ancres burger menu */}
      <div id="infos" />
      <div id="atouts" />

      {/* ── PROMOTIONS ACTIVES ── */}
      {promos && promos.length > 0 && (
        <div className="mx-auto max-w-5xl px-3 sm:px-4 pt-5">
          <PromoBanner promos={promos} slug={slug} currency={shop.currency} whatsapp={shop.whatsapp} />
        </div>
      )}

      {/* ── CONTENU PRINCIPAL ── */}
      <div className="mx-auto max-w-5xl px-3 sm:px-4 pb-32">

        {/* ── À LA UNE (carousel horizontal, seulement si produits featured) ── */}
        {!isFiltering && featured.length > 0 && (
          <section className="mt-7">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-normal text-shop/60">Sélection</p>
                <h2 className="mt-0.5 font-shop-heading text-lg font-extrabold">Coups de cœur ✨</h2>
              </div>
              <span className="rounded-full bg-shop/10 px-2.5 py-1 text-xs font-semibold text-shop">
                {featured.length}
              </span>
            </div>
            <div className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-3 sm:-mx-4 sm:px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {featured.map((p) => (
                <div key={p.id} className="w-[160px] shrink-0 snap-start sm:w-[190px]">
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

        {/* ── SECTION CATALOGUE ── */}
        <section className="mt-7">

          {/* En-tête */}
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-normal text-shop/60">Catalogue</p>
              <h2 className="mt-0.5 font-shop-heading text-xl font-extrabold sm:text-2xl">
                Nos produits
              </h2>
            </div>
            <span className="shrink-0 rounded-full bg-shop/10 px-3 py-1 text-xs font-semibold text-shop">
              {list.length}{products.length !== list.length ? ` / ${products.length}` : ""}
            </span>
          </div>

          {/* ── Barre de recherche ── */}
          <div className="relative mb-4">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-shop-muted transition-colors group-focus-within:text-shop pointer-events-none" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setActiveIdx(-1); }}
                onFocus={() => setFocused(true)}
                onKeyDown={handleKeyDown}
                placeholder={!focused && !q && animPlaceholder ? animPlaceholder : "Rechercher un produit…"}
                autoComplete="off"
                className="h-11 sm:h-12 w-full rounded-2xl border border-current/12 bg-shop-card/80 pl-10 pr-9 text-sm shadow-xs transition-all placeholder:text-shop-muted focus:border-shop/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-shop/15"
              />
              {q && (
                <button
                  onClick={() => { setQ(""); closeDropdown(); inputRef.current?.focus(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-shop-muted hover:text-shop-fg cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown suggestions */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-current/10 bg-background shadow-lift"
              >
                <p className="px-4 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-normal text-shop-muted">
                  Suggestions
                </p>
                <ul>
                  {suggestions.map((p, i) => (
                    <li key={p.id}>
                      <Link
                        to="/b/$slug/p/$productId"
                        params={{ slug, productId: p.id }}
                        onClick={() => { setQ(p.name); closeDropdown(); }}
                        onMouseEnter={() => setActiveIdx(i)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 transition-colors",
                          i === activeIdx ? "bg-shop/8" : "hover:bg-shop-card"
                        )}
                      >
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-shop-card">
                          {p.images[0] ? (
                            <img src={mediaUrl(p.images[0])!} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full place-items-center">
                              <Package className="h-4 w-4 opacity-40" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {p.name.split(new RegExp(`(${q})`, "gi")).map((part, j) =>
                              part.toLowerCase() === q.toLowerCase() ? (
                                <mark key={j} className="rounded bg-shop/20 px-0.5 not-italic text-shop-fg">
                                  {part}
                                </mark>
                              ) : part
                            )}
                          </p>
                          {p.description && (
                            <p className="mt-0.5 truncate text-xs text-shop-muted">{p.description}</p>
                          )}
                        </div>
                        <span className="shrink-0 text-sm font-bold text-shop">
                          {formatPrice(Number(p.price), p.currency)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={closeDropdown}
                  className="w-full border-t border-current/5 px-4 py-2.5 text-left text-xs text-shop-muted hover:text-shop-fg"
                >
                  Voir tous les résultats pour «&nbsp;{q}&nbsp;»
                </button>
              </div>
            )}
          </div>

          {/* ── Catégories pills ── */}
          {categories.length > 0 && (
            <div className="-mx-3 mb-5 flex items-center gap-2 overflow-x-auto px-3 pb-1 sm:-mx-4 sm:px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <Chip active={!cat} onClick={() => setCat(null)}>
                Tout ({products.length})
              </Chip>
              {categories.map((c) => {
                const cnt = products.filter((p) => p.category_id === c.id).length;
                return (
                  <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
                    {c.name} {cnt > 0 && `(${cnt})`}
                  </Chip>
                );
              })}
            </div>
          )}

          {/* ── Grille produits : TOUS les produits ── */}
          {list.length === 0 ? (
            <EmptyState
              hasProducts={products.length > 0}
              isFiltering={isFiltering}
              onReset={() => { setQ(""); setCat(null); }}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAdd={
                    (p.variants as Variant[]).length ? undefined : () => quickAdd(p)
                  }
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
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function EmptyState({
  hasProducts,
  isFiltering,
  onReset,
}: {
  hasProducts: boolean;
  isFiltering: boolean;
  onReset: () => void;
}) {
  return (
    <div className="mt-6 rounded-3xl border border-dashed border-current/15 bg-shop-card/50 px-6 py-16 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-shop/10 text-shop shadow-inner">
        <PackageSearch className="h-8 w-8" />
      </div>
      <h3 className="mt-4 font-shop-heading text-lg font-bold">
        {!hasProducts ? "Boutique en cours d'approvisionnement" : "Aucun article trouvé"}
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-shop-muted">
        {!hasProducts
          ? "Le commerçant prépare ses articles. Envoyez-lui un message sur WhatsApp pour toute demande !"
          : "Aucun produit ne correspond à votre recherche. Essayez d'autres mots-clés."}
      </p>
      {isFiltering && (
        <button
          onClick={onReset}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-shop px-5 text-xs font-bold text-shop-foreground shadow-md transition-transform   cursor-pointer"
        >
          <X className="h-3.5 w-3.5" /> Effacer la recherche
        </button>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 shrink-0 rounded-xl px-3.5 text-xs font-bold transition-all duration-200  cursor-pointer flex items-center whitespace-nowrap",
        active
          ? "bg-shop text-shop-foreground shadow-md ring-2 ring-shop/30"
          : "border border-current/15 bg-shop-card/80 text-shop-muted hover:border-current/30 hover:text-shop-fg shadow-xs"
      )}
    >
      {children}
    </button>
  );
}
