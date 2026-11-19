import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import {
  ShoppingBag,
  ArrowRight,
  MessageCircle,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  Store,
  Menu,
} from "lucide-react";
import { publicShopQuery } from "@/lib/storefront.query";
import { recordShopVisit } from "@/lib/storefront.functions";
import { useServerFn } from "@tanstack/react-start";
import { CartProvider, useCart } from "@/components/store/cart";
import { CartSheet } from "@/components/store/CartSheet";
import { absoluteMediaUrl, mediaUrl, shopStyle, formatPrice } from "@/lib/marketnet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/b/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(publicShopQuery(params.slug)),
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Boutique introuvable — MarketNet" }, { name: "robots", content: "noindex" }] };
    const { shop, origin } = loaderData;
    const title = `${shop.name} — Boutique en ligne | Commandes WhatsApp`;
    const desc = shop.description?.slice(0, 160) || `Découvrez le catalogue de ${shop.name}${shop.city ? ` à ${shop.city}` : ""}. Commandez directement sur WhatsApp sans intermédiaire.`;
    const shopUrl = `${origin}/b/${shop.slug}`;
    const shopCover = shop.banner_url || shop.logo_url;
    const ogImage = shopCover ? absoluteMediaUrl(shopCover, origin) : null;
    const isOffline = !shop.is_published || shop.is_suspended;

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "robots", content: isOffline ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1" },
        { property: "og:site_name", content: shop.name },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: shopUrl },
        ...(ogImage ? [
          { property: "og:image", content: ogImage },
          { property: "og:image:secure_url", content: ogImage },
          { property: "og:image:alt", content: `Boutique ${shop.name}` },
          { property: "og:image:width", content: "1200" },
          { property: "og:image:height", content: "630" },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:image", content: ogImage },
        ] : []),
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: shopUrl }],
    };
  },
  component: ShopLayout,
});

function ShopLayout() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(publicShopQuery(slug));
  const { shop, origin } = data;
  const visitFn = useServerFn(recordShopVisit);

  useEffect(() => {
    if (typeof window === "undefined" || !slug) return;
    const key = `marketnet_visit_${slug}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      visitFn({ data: { slug } }).catch(() => {});
    }
  }, [slug]);

  const isOffline = !shop.is_published || shop.is_suspended;

  return (
    <CartProvider slug={slug}>
      <div
        className={cn(`theme-${shop.theme || "savane"}`, "site-root min-h-screen text-slate-800 bg-[#f4f8fa] font-sans selection:bg-[#4F46E5] selection:text-white")}
        style={shopStyle(shop.primary_color || "#4F46E5")}
      >
        {/* ── 1. BANDEAU TICKER DÉFILANT EN HAUT (STYLE VYTRINI) ── */}
        <VytriniAnnouncementTicker shop={shop} />

        {/* ── 2. NAVBAR PILULE FLOTTANTE HAUT DE GAMME (STYLE VYTRINI) ── */}
        <VytriniFloatingNavbar shop={shop} slug={slug} isOffline={isOffline} />

        {/* ── 3. CONTENU DES PAGES (VITRINE / PRODUITS) ── */}
        <main className="pt-24 sm:pt-28">
          <Outlet />
        </main>

        {/* ── 4. FOOTER OFFICIEL RAFFINÉ (STYLE VYTRINI) ── */}
        <VytriniStoreFooter shop={shop} />

        {/* ── 5. TIROIR PANIER LATÉRAL ── */}
        {!isOffline && (
          <CartSheet shop={shop} origin={origin || (typeof window !== "undefined" ? window.location.origin : "")} />
        )}

        {/* ── 6. BARRE STICKY DU PANIER MOBILE (STYLE VYTRINI) ── */}
        {!isOffline && <VytriniStickyCartBar currency={shop.currency} />}
      </div>
    </CartProvider>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   1. BANNIÈRE ANNONCES TICKER EN TÊTE (STYLE VYTRINI)
   ══════════════════════════════════════════════════════════════════════════ */
function VytriniAnnouncementTicker({ shop }: { shop: any }) {
  const annonces = [
    `Livraison rapide partout en RDC • Commandes directes sur WhatsApp`,
    `Catalogue officiel en ligne de ${shop.name} • Prix en $ et FC`,
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
    <div className="fixed inset-x-0 top-0 z-60 h-9 sm:h-10 bg-[#1E293B] text-slate-200 text-[11px] sm:text-xs flex items-center justify-between px-3 sm:px-4 shadow-xs select-none">
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
   2. NAVBAR PILULE FLOTTANTE DÉCOLLÉE (STYLE VYTRINI)
   ══════════════════════════════════════════════════════════════════════════ */
function VytriniFloatingNavbar({
  shop,
  slug,
  isOffline,
}: {
  shop: any;
  slug: string;
  isOffline?: boolean;
}) {
  const { items, setOpen } = useCart();
  const count = items.reduce((s, i) => s + i.qty, 0);
  const logo = mediaUrl(shop.logo_url);

  function scrollToSection(id: string) {
    if (typeof window !== "undefined") {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <header className="fixed top-9 sm:top-10 inset-x-0 z-50 flex justify-center px-3 sm:px-4 pt-2 pointer-events-none">
      <div className="w-full max-w-5xl rounded-full bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-md px-4 sm:px-6 h-13 sm:h-14 flex items-center justify-between gap-3 pointer-events-auto transition-all">
        
        {/* GAUCHE : IDENTITÉ DE LA BOUTIQUE */}
        <Link
          to="/b/$slug"
          params={{ slug }}
          className="flex items-center gap-2.5 group shrink-0"
        >
          {logo ? (
            <img src={logo} alt={shop.name} className="h-8 w-8 rounded-full object-cover border border-slate-200 shadow-xs" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-[#4F46E5] text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
              {shop.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span className="font-bold text-sm sm:text-base text-slate-900 truncate max-w-[150px] sm:max-w-xs group-hover:text-[#4F46E5] transition-colors">
            {shop.name}
          </span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="En ligne" />
        </Link>

        {/* CENTRE : LIENS DE NAVIGATION RAPIDE */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => scrollToSection("catalogue")}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Catalogue
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("atouts")}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Pourquoi nous
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("contact")}
            className="hover:text-slate-900 transition-colors cursor-pointer"
          >
            Contact
          </button>
        </nav>

        {/* DROITE : ACTIONS (RECHERCHE & PANIER) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollToSection("catalogue")}
            title="Rechercher"
            aria-label="Rechercher un produit"
            className="h-9 w-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Search className="h-4 w-4" />
          </button>

          {!isOffline && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Voir le panier"
              className="relative h-9 px-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Panier</span>
              {count > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#4F46E5] text-[10px] font-black text-white">
                  {count}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   3. BARRE FLOTTANTE DU PANIER MOBILE (STICKY BOTTOM VYTRINI)
   ══════════════════════════════════════════════════════════════════════════ */
function VytriniStickyCartBar({ currency }: { currency?: string }) {
  const { items, setOpen } = useCart();
  const count = items.reduce((s, i) => s + i.qty, 0);
  if (count === 0) return null;

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const curr = currency || items[0]?.currency || "USD";

  return (
    <aside className="fixed bottom-4 inset-x-4 z-40 sm:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-13 rounded-full bg-slate-900 text-white shadow-xl px-5 flex items-center justify-between font-bold text-sm transition-transform active:scale-[0.98] border border-white/20 cursor-pointer animate-in fade-in slide-in-from-bottom-3 duration-300 select-none"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#4F46E5] text-xs font-black text-white">
            {count}
          </span>
          <span>Voir le panier</span>
        </div>
        <div className="flex items-center gap-1.5 font-bold">
          <span>{formatPrice(total, curr)}</span>
          <ArrowRight className="h-4 w-4 text-slate-300" />
        </div>
      </button>
    </aside>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   4. FOOTER OFFICIEL RAFFINÉ (STYLE VYTRINI)
   ══════════════════════════════════════════════════════════════════════════ */
function VytriniStoreFooter({ shop }: { shop: any }) {
  const whatsappDigits = shop.whatsapp?.replace(/\D/g, "") || "";
  const whatsappUrl = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
    `Bonjour ${shop.name}, je souhaiterais plus d'informations.`
  )}`;

  return (
    <footer id="contact" className="mt-20 border-t border-slate-200 bg-white pt-12 pb-16 px-5 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-xl text-slate-900">{shop.name}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
              Disponibilité • Fiabilité • Performance. Commandes en direct sans intermédiaire.
            </p>
            {shop.city && (
              <p className="text-xs text-slate-400 mt-2">
                📍 {shop.city} {shop.hours ? `• 🕒 ${shop.hours}` : ""}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row md:justify-end gap-3 items-start sm:items-center">
            {whatsappDigits && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs shadow-xs transition-colors"
              >
                <MessageCircle className="h-4 w-4 fill-white" />
                <span>Écrire sur WhatsApp</span>
              </a>
            )}
            {shop.whatsapp && (
              <a
                href={`tel:${shop.whatsapp}`}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
              >
                <Phone className="h-3.5 w-3.5 text-slate-600" />
                <span>{shop.whatsapp}</span>
              </a>
            )}
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} {shop.name}. Tous droits réservés.</p>
          <p>
            Boutique propulsée par{" "}
            <Link to="/" className="font-bold text-[#4F46E5] hover:underline">
              MarketNet
            </Link>{" "}
            • 0% de commission
          </p>
        </div>
      </div>
    </footer>
  );
}
