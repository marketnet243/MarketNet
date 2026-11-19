import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import {
  ShoppingBag,
  ArrowRight,
  MessageCircle,
  Search,
  X,
} from "lucide-react";
import { supabase } from "@/lib/imported-database";
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

    const schemaJson = {
      "@context": "https://schema.org",
      "@type": "Store",
      name: shop.name,
      description: desc,
      url: shopUrl,
      ...(shop.whatsapp ? { telephone: shop.whatsapp } : {}),
      ...(ogImage ? { image: ogImage } : {}),
      address: {
        "@type": "PostalAddress",
        addressLocality: shop.city || "Kinshasa",
        addressCountry: "CD",
      },
      ...(shop.hours ? { openingHours: shop.hours } : {}),
      priceRange: "$$",
    };

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
      links: [
        { rel: "canonical", href: shopUrl },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(schemaJson),
        },
      ],
    };
  },
  component: ShopLayout,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <h1 className="text-3xl font-extrabold">Boutique introuvable</h1>
        <p className="mt-2 text-muted-foreground">Ce lien n'existe pas ou la boutique est hors ligne.</p>
        <Link to="/" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 font-semibold text-primary-foreground">
          Découvrir MarketNet
        </Link>
      </div>
    </div>
  ),
  errorComponent: () => (
    <div className="grid min-h-screen place-items-center p-4 text-center text-muted-foreground">
      Impossible de charger la boutique. Vérifiez votre connexion.
    </div>
  ),
});

function ShopLayout() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(publicShopQuery(slug));
  const { shop, origin } = data;
  const visitFn = useServerFn(recordShopVisit);

  useEffect(() => {
    const k = `mn-view-${slug}`;
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const src = params?.get("src") ?? null;
    const pMatch = typeof window !== "undefined" ? window.location.pathname.match(/\/p\/([0-9a-f-]{36})/i) : null;
    const productId = pMatch ? pMatch[1] : null;

    if (!sessionStorage.getItem(k)) {
      sessionStorage.setItem(k, "1");
      visitFn({ data: { slug, src, productId } }).catch(() => {
        supabase.rpc("increment_shop_view", { _slug: slug });
      });
    }
  }, [slug]);

  const isOffline = !shop.is_published || shop.is_suspended;

  return (
    <CartProvider slug={slug}>
      <div className={`theme-${shop.theme} storefront min-h-screen pb-28`} style={shopStyle(shop.primary_color)}>
        
        {/* ── BANDEAU D'ANNONCE DYNAMIQUE DÉFILANT ── */}
        <AnnouncementBanner shop={shop} />

        {/* ── NAVBAR PRINCIPALE (STYLE VYTRINI) ── */}
        <TopBar
          shop={shop}
          slug={slug}
          isOffline={isOffline}
        />

        {/* ── CONTENU DES PAGES (VITRINE OU PRODUIT) ── */}
        <Outlet />

        {/* ── FOOTER OFFICIEL DE LA BOUTIQUE ── */}
        <footer className="mt-20 border-t border-current/10 py-12 px-4 text-center space-y-3 text-xs text-shop-muted">
          <p className="font-bold text-shop-foreground text-sm tracking-normal">
            {shop.name}
          </p>
          {shop.city && (
            <p className="text-[11px]">
              📍 {shop.city} {shop.hours ? `• 🕒 ${shop.hours}` : ""}
            </p>
          )}
          <p className="text-[11px] pt-1">
            Boutique propulsée par{" "}
            <Link to="/" className="font-bold underline text-shop">
              MarketNet
            </Link>{" "}
            • 0% de commission sur vos ventes
          </p>
        </footer>

        {/* ── TIROIR PANIER LATÉRAL (CARTSHEET) ── */}
        {!isOffline && (
          <CartSheet shop={shop} origin={origin || (typeof window !== "undefined" ? window.location.origin : "")} />
        )}

        {/* ── BARRE FLOTTANTE DE PANIER SUR MOBILE ── */}
        {!isOffline && (
          <FloatingCartBar currency={shop.currency} />
        )}
      </div>
    </CartProvider>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// BARRE DE PANIER FLOTTANTE SUR SMARTPHONE
// ══════════════════════════════════════════════════════════════════════════
function FloatingCartBar({ currency }: { currency?: string }) {
  const { items, setOpen } = useCart();
  const count = items.reduce((s, i) => s + i.qty, 0);
  if (count === 0) return null;

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const curr = currency || items[0]?.currency || "USD";

  return (
    <aside aria-label="Aperçu du panier mobile" className="fixed bottom-4 inset-x-4 z-40 sm:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-13 rounded-2xl bg-shop text-shop-foreground shadow-lift px-4 flex items-center justify-between font-bold text-sm transition-transform  border-2 border-white/20 cursor-pointer animate-in fade-in slide-in-from-bottom-3 duration-300 select-none"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-shop-foreground/20 text-xs font-black">
            {count}
          </span>
          <span>Voir mon panier</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono">
          <span>{formatPrice(total, curr)}</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </button>
    </aside>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// NAVBAR & MENU DÉROULANT COMPLET (INSPIRATION DIRECTE VYTRINI)
// ══════════════════════════════════════════════════════════════════════════
function TopBar({
  shop,
  slug,
  isOffline,
}: {
  shop: any;
  slug: string;
  isOffline?: boolean;
}) {
  const { items, setOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const whatsappDigits = (shop.whatsapp?.replace(/\D/g, "") || "");
  const whatsappUrl = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
    `Bonjour ${shop.name}, je vous contacte depuis votre boutique en ligne.`
  )}`;

  function scrollToSection(id: string) {
    setMenuOpen(false);
    if (typeof window !== "undefined") {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }

  return (
    <div className="sticky top-0 z-30 border-b border-current/10 bg-shop-bg/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-14 sm:h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        
        {/* Identité Boutique avec Pastille Verte de Statut (comme chez Vytrini) */}
        <Link
          to="/b/$slug"
          params={{ slug }}
          className="flex items-center gap-2.5 font-shop-heading font-black text-sm sm:text-base group tracking-normal"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse shrink-0" />
          <span className="truncate max-w-[170px] sm:max-w-xs group-hover:opacity-80 transition-opacity">
            {shop.name}
          </span>
        </Link>

        {/* Actions à droite : Recherche, Panier & Menu Burger (=) */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Raccourci vers la recherche de catalogue */}
          <button
            type="button"
            onClick={() => scrollToSection("catalogue")}
            aria-label="Rechercher"
            className="grid h-10 w-10 place-items-center rounded-xl text-shop-fg hover:bg-shop/10 transition-colors cursor-pointer"
          >
            <Search className="h-4.5 w-4.5" />
          </button>

          {/* Panier avec compteur dynamique */}
          {!isOffline && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Voir le panier"
              className="relative flex h-10 items-center justify-center rounded-xl bg-shop/10 hover:bg-shop/15 px-3 text-xs sm:text-sm font-bold text-shop transition-all  cursor-pointer gap-2"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              <span className="hidden sm:inline font-bold">Panier</span>
              {count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-shop px-1.5 text-[10px] font-black text-shop-foreground shadow-xs animate-in zoom-in-50 duration-200">
                  {count}
                </span>
              )}
            </button>
          )}

          {/* Bouton Hamburger épuré (= 2 traits horizontaux style Vytrini) */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu de navigation"
            className="grid h-10 w-10 place-items-center rounded-xl text-shop-fg hover:bg-shop/10 transition-colors cursor-pointer"
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <div className="flex flex-col gap-1.5 w-5">
                <span className="h-0.5 w-full bg-current rounded-full" />
                <span className="h-0.5 w-full bg-current rounded-full" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* ── MENU COULISSANT ÉPURÉ (EXACTEMENT COMME SUR LA CAPTURE VITRINI) ── */}
      {menuOpen && (
        <div className="border-b border-current/15 bg-shop-card/98 backdrop-blur-xl px-6 py-6 shadow-lift animate-in slide-in-from-top-2 duration-200">
          <div className="mx-auto max-w-md space-y-4">
            
            {/* Liste de navigation numérotée — 2 items seulement */}
            <nav className="divide-y divide-current/10 text-xs sm:text-sm font-black tracking-normal uppercase">
              <button
                type="button"
                onClick={() => scrollToSection("catalogue")}
                className="w-full py-4 flex items-center justify-between text-left hover:text-shop transition-colors cursor-pointer"
              >
                <span>NOS PRODUITS</span>
                <span className="text-shop-muted text-[11px] font-mono">01</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("about")}
                className="w-full py-4 flex items-center justify-between text-left hover:text-shop transition-colors cursor-pointer"
              >
                <span>À PROPOS</span>
                <span className="text-shop-muted text-[11px] font-mono">02</span>
              </button>
            </nav>

            {/* Bouton Pro Émeraude : Écrire sur WhatsApp (Style Vytrini) */}
            {whatsappDigits && (
              <div className="pt-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="w-full h-12 rounded-full bg-[#10b981] hover:bg-[#059669] text-primary-foreground flex items-center justify-center gap-2 font-black text-xs sm:text-sm tracking-normal uppercase shadow-soft shadow-success/25 transition-transform  cursor-pointer select-none"
                >
                  <MessageCircle className="h-4.5 w-4.5 fill-white" />
                  <span>ÉCRIRE SUR WHATSAPP</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ══════════════════════════════════════════════════════════════════════════
// BANDEAU D'ANNONCE DYNAMIQUE DÉFILANT AUTOMATIQUEMENT
// ══════════════════════════════════════════════════════════════════════════
function AnnouncementBanner({ shop }: { shop: any }) {
  const slides = buildSlides(shop);
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % slides.length);
    }, 5500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="bg-[#0f172a] text-primary-foreground select-none overflow-hidden" style={{ height: "38px" }}>
      <div className="relative h-full mx-auto max-w-xl px-6">
        {slides.map((s, i) => (
          <div
            key={i}
            aria-hidden={i !== idx}
            className={
              "absolute inset-0 flex items-center justify-center gap-2 text-[11px] sm:text-xs font-medium transition-all duration-700 ease-in-out " +
              (i === idx
                ? "opacity-100 translate-y-0"
                : i === (idx - 1 + slides.length) % slides.length
                ? "opacity-0 -translate-y-3 pointer-events-none"
                : "opacity-0 translate-y-3 pointer-events-none")
            }
          >
            <span className="text-sm leading-none shrink-0">{s.icon}</span>
            <span className="text-center leading-tight">{s.text}</span>
          </div>
        ))}
        {/* Indicateur discret */}
        {slides.length > 1 && (
          <div className="absolute bottom-1.5 right-0 flex gap-1">
            {slides.map((_, i) => (
              <span
                key={i}
                className={
                  "block h-0.5 rounded-full transition-all duration-500 " +
                  (i === idx ? "w-4 bg-card/70" : "w-1.5 bg-card/20")
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function buildSlides(shop: any): { icon: string; text: string }[] {
  const slides: { icon: string; text: string }[] = [];
  if (shop.city) slides.push({ icon: "📍", text: `Livraison rapide disponible à ${shop.city}` });
  if (shop.hours) slides.push({ icon: "🕒", text: `Horaires d'ouverture : ${shop.hours}` });
  if (shop.whatsapp) slides.push({ icon: "💬", text: "Commandez directement sur WhatsApp • Réponse rapide garantie" });
  slides.push({ icon: "🛡️", text: "0% de commission — vous payez le prix affiché, sans frais cachés" });
  if (shop.name) slides.push({ icon: "🏪", text: `Bienvenue dans la boutique officielle de ${shop.name}` });
  return slides;
}
