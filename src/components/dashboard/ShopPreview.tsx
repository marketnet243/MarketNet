import { useState } from "react";
import { Monitor, Smartphone, ShoppingBag, BadgeCheck } from "lucide-react";
import type { ShopDraft } from "./ShopFields";
import type { Product } from "@/hooks/useMyShop";
import {
  StoreHeader,
  ProductCard,
  StoreFeaturesSection,
  VytriniAnnouncementTicker,
  VytriniStoreFooter,
} from "@/components/store/StoreParts";
import { PromoBanner, type PublicPromo } from "@/components/promo/PromoBanner";
import { shopStyle, mediaUrl, parseShopTheme } from "@/lib/marketnet";
import { cn } from "@/lib/utils";
import { StoreOfflineView } from "@/components/store/StoreOfflineView";

const SAMPLE_PRODUCTS = [
  { id: "s1", name: "Pagne wax premium sélection", price: 25, currency: "USD", images: [], status: "active", featured: true, stock: 12, variants: [] },
  { id: "s2", name: "Sac en cuir véritable artisanal", price: 40, currency: "USD", images: [], status: "active", featured: true, stock: 8, variants: [] },
  { id: "s3", name: "Sandales cuir tressées à la main", price: 18, currency: "USD", images: [], status: "active", featured: false, stock: 15, variants: [] },
  { id: "s4", name: "Parure collier et bracelets perlés", price: 12, currency: "USD", images: [], status: "active", featured: false, stock: 5, variants: [] },
  { id: "s5", name: "Montre chronographe élégance", price: 45, currency: "USD", images: [], status: "active", featured: false, stock: 4, variants: [] },
  { id: "s6", name: "Robe soirée style contemporain", price: 35, currency: "USD", images: [], status: "active", featured: false, stock: 7, variants: [] },
] as unknown as Product[];

export function ShopPreview({
  draft,
  products,
  promotions,
  isPublished = true,
  isSuspended = false,
}: {
  draft: ShopDraft;
  products?: Product[];
  promotions?: PublicPromo[];
  isPublished?: boolean;
  isSuspended?: boolean;
}) {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");

  // Décodage des préférences de thème, modèle, typographie et grille
  const themeConfig = parseShopTheme(draft.theme);
  const fontClass =
    themeConfig.font === "display"
      ? "font-display"
      : themeConfig.font === "serif"
      ? "font-serif"
      : "font-sans";

  const items = products?.filter((p) => p.status !== "hidden");
  const list = items && items.length > 0 ? items : SAMPLE_PRODUCTS;
  const featured = list.filter((p) => p.featured);
  const isOffline = !isPublished || isSuspended;

  // Calcul de la classe de grille en fonction du style choisi
  const gridContainerClass =
    themeConfig.grid === "grid-large"
      ? device === "mobile"
        ? "grid grid-cols-1 gap-3.5"
        : "grid grid-cols-2 lg:grid-cols-3 gap-5"
      : themeConfig.grid === "list"
      ? "flex flex-col gap-3"
      : device === "mobile"
      ? "grid grid-cols-2 gap-2.5"
      : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5";

  const logo = mediaUrl(draft.logo_url);
  const shopName = draft.name || "Ma boutique";

  return (
    <div className="space-y-3">
      {/* ── SÉLECTEUR APPAREIL (MOBILE / ORDINATEUR) ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">Aperçu en direct</p>
          <p className="text-[11px] text-slate-400">Rendu fidèle de votre vitrine telle que vos clients la voient</p>
        </div>
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
              device === "mobile"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Mobile</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer",
              device === "desktop"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Ordinateur</span>
          </button>
        </div>
      </div>

      {/* ── CONTENEUR SIMULATEUR D'APPAREIL ── */}
      <div
        className={cn(
          "mx-auto overflow-hidden bg-slate-900 shadow-2xl transition-all duration-300",
          device === "mobile"
            ? "max-w-[360px] rounded-[2.5rem] border-[10px] border-slate-900 ring-1 ring-slate-800"
            : "w-full max-w-full rounded-2xl border-4 border-slate-800 ring-1 ring-slate-700"
        )}
      >
        <div
          className={cn(
            `theme-${themeConfig.theme}`,
            fontClass,
            "storefront h-[640px] overflow-y-auto bg-[#f4f8fa] text-slate-800 select-none scrollbar-thin"
          )}
          style={shopStyle(draft.primary_color || "#4F46E5")}
        >
          {/* 1. TICKER DÉFILANT OFFICIEL */}
          <VytriniAnnouncementTicker shop={draft} />

          {/* 2. BARRE PILULE FLOTTANTE VYTRINI D'APERÇU */}
          <div className="sticky top-2 z-30 px-3 pt-2">
            <div className="w-full rounded-full bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-md px-3.5 h-11 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {logo ? (
                  <img
                    src={logo}
                    alt={shopName}
                    className="h-7 w-7 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-[#4F46E5] text-white font-extrabold text-[10px] flex items-center justify-center shrink-0">
                    {shopName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="font-bold text-xs text-slate-900 truncate max-w-[140px]">
                  {shopName}
                </span>
                {isPublished && !isSuspended && (
                  <BadgeCheck className="h-3.5 w-3.5 text-[#4F46E5] shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
                  Aperçu
                </span>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 relative">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#4F46E5] text-[9px] font-bold text-white">
                    0
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. HERO STORE HEADER COMPLET (AVEC BANNIÈRE, LOGO, WHATSAPP, MÉTRIQUES) */}
          <div className="pt-2">
            <StoreHeader
              shop={{ ...draft, name: shopName }}
              isPublished={isPublished}
              isSuspended={isSuspended}
            />
          </div>

          {isOffline ? (
            <StoreOfflineView
              shop={draft}
              isSuspended={isSuspended}
              compact={device === "mobile"}
            />
          ) : (
            <>
              {/* 4. BANNIÈRE PROMOTION SUR LA VITRINE */}
              {promotions && promotions.length > 0 && (
                <div className="mx-auto max-w-5xl px-3 sm:px-4 pt-4">
                  <PromoBanner
                    promos={promotions}
                    slug={draft.slug || "boutique"}
                    currency={draft.currency || "USD"}
                    whatsapp={draft.whatsapp || ""}
                  />
                </div>
              )}

              {/* 5. CONTENU SELON MODÈLE DE PAGE */}
              <div className="mx-auto max-w-5xl px-3 sm:px-4 pb-12 pt-4">
                {/* SI MODÈLE VITRINE : ATOUTS DE MARQUE MIS EN AVANT D'ABORD */}
                {themeConfig.model === "vitrine" && (
                  <div className="mb-6">
                    <StoreFeaturesSection shopName={shopName} />
                  </div>
                )}

                {/* SÉLECTION DU MOMENT (CAROUSEL) */}
                {featured.length > 0 && (
                  <div className="mb-6">
                    <div className="mb-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#4F46E5]">Sélection</p>
                        <h2 className="font-shop-heading text-sm sm:text-base font-extrabold text-slate-900">
                          Coups de cœur ✨
                        </h2>
                      </div>
                      <span className="rounded-full bg-[#EEF2FF] border border-[#E0E7FF] px-2 py-0.5 text-[10px] font-bold text-[#4F46E5]">
                        {featured.length}
                      </span>
                    </div>
                    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                      {featured.map((p) => (
                        <div key={p.id} className="w-[145px] sm:w-[170px] shrink-0">
                          <ProductCard product={p} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* EN-TÊTE CATALOGUE */}
                <div className="mb-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#4F46E5]">Articles</p>
                    <h2 className="font-shop-heading text-sm sm:text-lg font-extrabold text-slate-900">
                      Tout notre catalogue
                    </h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                    {list.length} article{list.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* GRILLE DYNAMIQUE ADAPTÉE AU STYLE (GRID-2, GRANDES CARTES, OU LISTE) */}
                <div className={gridContainerClass}>
                  {list.map((p, i) => (
                    <ProductCard key={p.id || i} product={p} />
                  ))}
                </div>

                {/* ATOUTS COMMERÇANT SI MODÈLE NON-VITRINE */}
                {themeConfig.model !== "vitrine" && (
                  <StoreFeaturesSection shopName={shopName} />
                )}
              </div>

              {/* 6. PIED DE PAGE OFFICIEL AVEC BOUTON WHATSAPP PUR */}
              <VytriniStoreFooter shop={{ ...draft, name: shopName }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
