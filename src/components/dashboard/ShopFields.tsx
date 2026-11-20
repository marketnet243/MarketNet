import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  ImagePlus,
  Loader2,
  XCircle,
  Sparkles,
  LayoutTemplate,
  Palette,
  Type,
  Grid,
  Store,
  Heart,
  Layers,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/imported-database";
import {
  THEMES,
  SHOP_PAGE_MODELS,
  SHOP_COLOR_PALETTES,
  SHOP_FONTS,
  PRODUCT_GRID_STYLES,
  SHOP_CATEGORIES,
  PRESET_COLORS,
  mediaUrl,
  slugify,
  SLUG_RE,
  parseShopTheme,
  serializeShopTheme,
} from "@/lib/marketnet";
import { compressAndUpload } from "@/lib/upload";
import { cloudinaryUploadSignature } from "@/lib/cloudinary.functions";
import { cn } from "@/lib/utils";

export type ShopDraft = {
  name: string; slug: string; description: string; category: string; category_custom: string;
  logo_url: string | null; banner_url: string | null;
  city: string; address: string; whatsapp: string; hours: string;
  facebook: string; instagram: string; tiktok: string;
  theme: string; primary_color: string; currency: string;
};

export const emptyDraft: ShopDraft = {
  name: "", slug: "", description: "", category: "", category_custom: "", logo_url: null, banner_url: null,
  city: "", address: "", whatsapp: "+243", hours: "", facebook: "", instagram: "", tiktok: "",
  theme: "savane", primary_color: "#4F46E5", currency: "USD",
};

type P = { draft: ShopDraft; set: (p: Partial<ShopDraft>) => void };

const sel = "flex h-12 w-full rounded-xl border border-input bg-card px-3 text-sm";

export function IdentityFields({ draft, set, slugLocked, currentSlug }: P & { slugLocked?: boolean; currentSlug?: string }) {
  const [slugState, setSlugState] = useState<"idle" | "checking" | "free" | "taken" | "error">("idle");
  const [autoSlug, setAutoSlug] = useState<boolean>(!currentSlug);
  const checkId = useRef(0);

  const isCurrentSlug = !!currentSlug && draft.slug === currentSlug;
  const isLocked = slugLocked || isCurrentSlug;

  useEffect(() => {
    // Si le lien est verrouillé ou s'il s'agit déjà du lien actuel de la boutique, pas besoin de vérifier
    if (slugLocked || isCurrentSlug || !SLUG_RE.test(draft.slug)) {
      setSlugState("idle");
      return;
    }
    setSlugState("checking");
    const id = ++checkId.current;
    const t = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc("slug_available", { _slug: draft.slug });
        if (id !== checkId.current) return;
        if (error) {
          console.error("Erreur vérification slug:", error);
          setSlugState("error");
          return;
        }
        setSlugState(data ? "free" : "taken");
      } catch (err) {
        if (id !== checkId.current) return;
        console.error("Erreur RPC slug:", err);
        setSlugState("error");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [draft.slug, slugLocked, isCurrentSlug]);

  return (
    <div className="space-y-4 min-w-0 max-w-full">
      <Field label="Nom de la boutique">
        <Input
          className="h-12 w-full min-w-0"
          value={draft.name}
          maxLength={80}
          onChange={(e) => {
            const newName = e.target.value;
            set({
              name: newName,
              ...(autoSlug && !isLocked ? { slug: slugify(newName) } : {}),
            });
          }}
        />
      </Field>
      <Field label="Lien de la boutique">
        <div
          className={cn(
            "flex h-12 w-full min-w-0 max-w-full items-center overflow-hidden rounded-xl border bg-card text-sm transition-colors",
            isCurrentSlug
              ? "border-input bg-muted/30"
              : slugState === "taken" || slugState === "error"
              ? "border-destructive"
              : slugState === "free"
              ? "border-success"
              : "border-input"
          )}
        >
          {(() => {
            const host =
              typeof window !== "undefined" && window.location?.host
                ? window.location.host
                : ((import.meta.env.VITE_PUBLIC_URL as string | undefined) ||
                   (import.meta.env.VITE_MARKETNET_SITE_URL as string | undefined) ||
                   "appmarketnet.vercel.app"
                  )
                    .replace(/^https?:\/\//, "")
                    .replace(/\/+$/, "");
            return (
              <span
                title={`${host}/b/`}
                className="pl-3 pr-0 text-xs sm:text-sm font-medium text-muted-foreground select-none shrink truncate max-w-[140px] sm:max-w-none"
              >
                {host}/b/
              </span>
            );
          })()}
          <input
            className="h-full min-w-0 flex-1 bg-transparent pl-0.5 pr-2 outline-none disabled:opacity-90 disabled:cursor-not-allowed font-medium text-xs sm:text-sm truncate text-foreground"
            value={draft.slug}
            disabled={isLocked}
            onChange={(e) => {
              setAutoSlug(false);
              set({
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 42),
              });
            }}
          />
          {isCurrentSlug && <Check className="mr-3 h-4 w-4 text-success shrink-0" />}
          {!isLocked && slugState === "checking" && (
            <Loader2 className="mr-3 h-4 w-4 animate-spin text-muted-foreground shrink-0" />
          )}
          {!isLocked && slugState === "free" && <Check className="mr-3 h-4 w-4 text-success shrink-0" />}
          {!isLocked && (slugState === "taken" || slugState === "error") && (
            <XCircle className="mr-3 h-4 w-4 text-destructive shrink-0" />
          )}
        </div>
        {!isLocked && (
          <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={autoSlug}
              onChange={(e) => {
                const checked = e.target.checked;
                setAutoSlug(checked);
                if (checked && draft.name) {
                  set({ slug: slugify(draft.name) });
                }
              }}
              className="rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5] h-3.5 w-3.5 cursor-pointer"
            />
            <span>Générer automatiquement le lien depuis le nom</span>
          </label>
        )}
        {!isLocked && slugState === "taken" && (
          <p className="text-xs font-medium text-destructive">Ce lien est déjà pris, choisissez-en un autre.</p>
        )}
        {!isLocked && slugState === "free" && (
          <p className="text-xs font-medium text-success">Ce lien est disponible.</p>
        )}
        {!isLocked && slugState === "error" && (
          <p className="text-xs font-medium text-destructive">Impossible de vérifier la disponibilité du lien pour le moment.</p>
        )}
      </Field>
      <Field label="Catégorie">
        <select
          className={sel}
          value={draft.category}
          onChange={(e) => {
            const nextCat = e.target.value;
            set({
              category: nextCat,
              ...(nextCat !== "Autre" ? { category_custom: "" } : {}),
            });
          }}
        >
          <option value="">Choisir…</option>
          {SHOP_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      {draft.category === "Autre" && (
        <Field label="Décrivez la catégorie de votre boutique">
          <Input
            className="h-12 w-full min-w-0"
            maxLength={40}
            placeholder="Ex. Papeterie, Fleuriste, Animalerie…"
            value={draft.category_custom}
            onChange={(e) => set({ category_custom: e.target.value.slice(0, 40) })}
            required
          />
        </Field>
      )}
      <Field label="Description">
        <Textarea
          rows={3}
          maxLength={1000}
          value={draft.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Ce que vous vendez, ce qui vous rend unique…"
          className="w-full min-w-0"
        />
      </Field>
    </div>
  );
}

export function ContactFields({ draft, set }: P) {
  return (
    <div className="space-y-4 min-w-0 max-w-full">
      <Field label="Numéro WhatsApp">
        <Input
          className="h-12 w-full min-w-0"
          inputMode="tel"
          placeholder="+243812345678"
          value={draft.whatsapp}
          onChange={(e) => set({ whatsapp: e.target.value.replace(/[^\d+]/g, "") })}
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
        <Field label="Ville">
          <Input
            className="h-12 w-full min-w-0"
            value={draft.city}
            onChange={(e) => set({ city: e.target.value })}
            placeholder="Lubumbashi"
          />
        </Field>
        <Field label="Devise affichée">
          <select
            className={sel}
            value={draft.currency}
            onChange={(e) => set({ currency: e.target.value })}
          >
            <option value="USD">USD ($)</option>
            <option value="CDF">CDF (FC)</option>
          </select>
        </Field>
      </div>
      <Field label="Adresse">
        <Input
          className="h-12 w-full min-w-0"
          value={draft.address}
          onChange={(e) => set({ address: e.target.value })}
        />
      </Field>
      <Field label="Horaires">
        <Input
          className="h-12 w-full min-w-0"
          value={draft.hours}
          onChange={(e) => set({ hours: e.target.value })}
          placeholder="Lun–Sam, 8h–18h"
        />
      </Field>
      <Field label="Facebook (lien)">
        <Input
          className="h-12 w-full min-w-0"
          value={draft.facebook}
          onChange={(e) => set({ facebook: e.target.value })}
          placeholder="https://facebook.com/…"
        />
      </Field>
      <Field label="Instagram (lien)">
        <Input
          className="h-12 w-full min-w-0"
          value={draft.instagram}
          onChange={(e) => set({ instagram: e.target.value })}
          placeholder="https://instagram.com/…"
        />
      </Field>
      <Field label="TikTok (lien)">
        <Input
          className="h-12 w-full min-w-0"
          value={draft.tiktok}
          onChange={(e) => set({ tiktok: e.target.value })}
        />
      </Field>
    </div>
  );
}

export function AppearanceFields({ draft, set }: P) {
  const themeSettings = parseShopTheme(draft.theme);
  const selectedModel = themeSettings.model;
  const selectedFont = themeSettings.font;
  const selectedGrid = themeSettings.grid;

  // États pliables accordéon pour chaque bloc (comme Vytrini)
  const [openModel, setOpenModel] = useState(false);
  const [openThemes, setOpenThemes] = useState(false);
  const [openColors, setOpenColors] = useState(false);
  const [openFonts, setOpenFonts] = useState(false);
  const [openGrid, setOpenGrid] = useState(false);

  // Labels dynamiques pour résumer la sélection quand la section est fermée
  const currentModelObj = SHOP_PAGE_MODELS.find((m) => m.id === selectedModel);
  const currentThemeObj = THEMES.find((t) => t.id === themeSettings.theme);
  const currentFontObj = SHOP_FONTS.find((f) => f.id === selectedFont);
  const currentGridObj = PRODUCT_GRID_STYLES.find((g) => g.id === selectedGrid);

  return (
    <div className="space-y-4 min-w-0 max-w-full">
      {/* ── VISUELS CLÉS (Logo & Bannière) ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="mb-3">
          <h3 className="text-sm font-bold text-slate-900">Images de marque</h3>
          <p className="text-xs text-slate-500">Logo carré et grande bannière d'en-tête de votre vitrine</p>
        </div>
        <div className="grid grid-cols-2 gap-3 min-w-0">
          <ImageField label="Logo" value={draft.logo_url} onChange={(v) => set({ logo_url: v })} square />
          <ImageField label="Bannière" value={draft.banner_url} onChange={(v) => set({ banner_url: v })} />
        </div>
      </div>

      {/* ── 1. MODÈLES DE PAGE (Pliable) ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setOpenModel(!openModel)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
              <LayoutTemplate className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900">Modèle de page</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {currentModelObj?.name || "Généraliste"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Architecture & structure de la vitrine</p>
            </div>
          </div>
          <ChevronDown
            className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", openModel && "rotate-180 text-slate-700")}
          />
        </button>

        {openModel && (
          <div className="p-4 pt-1 border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs text-slate-500 mb-3">
              Réorganise ta vitrine sans toucher à tes textes ni à tes produits.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SHOP_PAGE_MODELS.map((m) => {
                const isSelected = selectedModel === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => set({ theme: serializeShopTheme({ model: m.id }, draft.theme) })}
                    className={cn(
                      "flex items-start gap-3 p-3.5 rounded-2xl border text-left transition cursor-pointer relative",
                      isSelected
                        ? "border-[#4F46E5] bg-[#EEF2FF]/60 shadow-xs ring-1 ring-[#4F46E5]/30"
                        : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                        isSelected ? "bg-[#4F46E5] text-white" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {m.id === "generaliste" && <Store className="h-4 w-4" />}
                      {m.id === "mode" && <Sparkles className="h-4 w-4" />}
                      {m.id === "beaute" && <Heart className="h-4 w-4" />}
                      {m.id === "vitrine" && <Layers className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">{m.name}</p>
                        {isSelected && <span className="h-2 w-2 rounded-full bg-[#4F46E5] shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {m.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 2. THÈMES RECOMMANDÉS (Pliable) ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setOpenThemes(!openThemes)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900">Thème & Atmosphère</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {currentThemeObj?.name || "Épure Pro"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Ambiance visuelle globale de la vitrine</p>
            </div>
          </div>
          <ChevronDown
            className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", openThemes && "rotate-180 text-slate-700")}
          />
        </button>

        {openThemes && (
          <div className="p-4 pt-1 border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs text-slate-500 mb-3">Styles modernes sans encombrement</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 min-w-0">
              {THEMES.map((t) => {
                const isSelected = themeSettings.theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => set({ theme: serializeShopTheme({ theme: t.id }, draft.theme) })}
                    className={cn(
                      "rounded-2xl border-2 p-2.5 sm:p-3 text-left transition cursor-pointer min-w-0",
                      isSelected
                        ? "border-[#4F46E5] bg-[#EEF2FF]/40 shadow-xs ring-1 ring-[#4F46E5]/30"
                        : "border-slate-200/80 bg-white hover:border-slate-300"
                    )}
                  >
                    <div className="flex h-8 overflow-hidden rounded-xl shadow-xs border border-slate-200/50">
                      {t.swatch.map((c, i) => (
                        <span key={i} className="flex-1" style={{ background: c }} />
                      ))}
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-900 truncate">{t.name}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. PALETTES DE COULEURS (Pliable) ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setOpenColors(!openColors)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900">Couleurs & Accent</span>
                <span
                  className="h-3.5 w-3.5 rounded-full border border-slate-300 shadow-xs"
                  style={{ background: draft.primary_color }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Teintes principales des boutons et badges</p>
            </div>
          </div>
          <ChevronDown
            className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", openColors && "rotate-180 text-slate-700")}
          />
        </button>

        {openColors && (
          <div className="p-4 pt-1 border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs text-slate-500 mb-3">Combinaisons étudiées pour une boutique professionnelle</p>
            {/* Exemples de palettes en bandeaux cliquables */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {SHOP_COLOR_PALETTES.map((pal) => {
                const isSelected = draft.primary_color.toUpperCase() === pal.primary.toUpperCase();
                return (
                  <button
                    key={pal.name}
                    type="button"
                    onClick={() => set({ primary_color: pal.primary })}
                    className={cn(
                      "p-2.5 rounded-2xl border text-left transition cursor-pointer",
                      isSelected
                        ? "border-[#4F46E5] bg-[#EEF2FF]/50 ring-2 ring-[#4F46E5]/20 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <div className="flex h-5 rounded-lg overflow-hidden border border-slate-200/80 mb-1.5">
                      <span className="flex-1" style={{ background: pal.primary }} />
                      <span className="w-3.5" style={{ background: pal.accent }} />
                      <span className="w-3.5" style={{ background: pal.card }} />
                    </div>
                    <p className="text-[11px] font-bold text-slate-800 truncate">{pal.name}</p>
                  </button>
                );
              })}
            </div>

            {/* Sélecteur de couleur personnalisée */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60">
              <span className="text-xs text-slate-500 font-semibold mr-1">Couleur directe :</span>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => set({ primary_color: c })}
                  className="grid h-7 w-7 place-items-center rounded-full transition-transform cursor-pointer relative"
                  style={{
                    background: c,
                    boxShadow: draft.primary_color.toUpperCase() === c.toUpperCase() ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : undefined,
                  }}
                >
                  {draft.primary_color.toUpperCase() === c.toUpperCase() && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </button>
              ))}
              <label
                title="Couleur personnalisée"
                className="relative grid h-7 w-7 place-items-center rounded-full border border-dashed border-slate-300 cursor-pointer hover:border-[#4F46E5] transition-colors overflow-hidden"
              >
                <input
                  type="color"
                  value={draft.primary_color}
                  onChange={(e) => set({ primary_color: e.target.value.toUpperCase() })}
                  className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                  aria-label="Couleur personnalisée"
                />
                <span className="text-xs font-bold text-slate-500 select-none">+</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. POLICES DE CARACTÈRES (Pliable) ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setOpenFonts(!openFonts)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
              <Type className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900">Typographie</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {currentFontObj?.name.split(" ")[0] || "Moderne"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Style d'écriture pour les titres et les prix</p>
            </div>
          </div>
          <ChevronDown
            className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", openFonts && "rotate-180 text-slate-700")}
          />
        </button>

        {openFonts && (
          <div className="p-4 pt-1 border-t border-slate-100 bg-slate-50/30">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SHOP_FONTS.map((f) => {
                const isSelected = selectedFont === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => set({ theme: serializeShopTheme({ font: f.id }, draft.theme) })}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition cursor-pointer",
                      isSelected
                        ? "border-[#4F46E5] bg-[#EEF2FF]/60 shadow-xs ring-1 ring-[#4F46E5]/30"
                        : "border-slate-200/80 bg-white hover:border-slate-300"
                    )}
                  >
                    <p className="text-lg font-bold text-slate-900">{f.preview}</p>
                    <p className="text-xs font-semibold text-slate-700 mt-1 truncate">{f.name}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 5. DISPOSITION GRILLE PRODUIT (Pliable) ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setOpenGrid(!openGrid)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
              <Grid className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900">Affichage grille produit</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {currentGridObj?.name.split(" ")[0] || "Grille"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Disposition des fiches dans le catalogue</p>
            </div>
          </div>
          <ChevronDown
            className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", openGrid && "rotate-180 text-slate-700")}
          />
        </button>

        {openGrid && (
          <div className="p-4 pt-1 border-t border-slate-100 bg-slate-50/30">
            <div className="space-y-2">
              {PRODUCT_GRID_STYLES.map((g) => {
                const isSelected = selectedGrid === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => set({ theme: serializeShopTheme({ grid: g.id }, draft.theme) })}
                    className={cn(
                      "flex items-center justify-between w-full p-3.5 rounded-2xl border text-left transition cursor-pointer",
                      isSelected
                        ? "border-[#4F46E5] bg-[#EEF2FF]/60 shadow-xs ring-1 ring-[#4F46E5]/30"
                        : "border-slate-200/80 bg-white hover:border-slate-300"
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs sm:text-sm font-bold text-slate-900">{g.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{g.desc}</p>
                    </div>
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                        isSelected ? "border-[#4F46E5] bg-[#4F46E5]" : "border-slate-300 bg-white"
                      )}
                    >
                      {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>;
}

export function ImageField({ label, value, onChange, square }: { label: string; value: string | null; onChange: (v: string | null) => void; square?: boolean }) {
  const [busy, setBusy] = useState(false);
  const signUpload = useServerFn(cloudinaryUploadSignature);
  const url = mediaUrl(value);
  async function pick(f?: File) {
    if (!f) return;
    setBusy(true);
    try {
      onChange(await compressAndUpload(f, "storefront", signUpload, square ? 512 : 1600));
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <label className={cn("relative grid cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed bg-card text-muted-foreground", square ? "aspect-square" : "aspect-video sm:aspect-square")}>
        {url ? <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" /> : busy ? null : <ImagePlus className="h-6 w-6" />}
        {busy && <Loader2 className="relative h-6 w-6 animate-spin" />}
        <input type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
      </label>
      {value && <button type="button" className="text-xs text-destructive" onClick={() => onChange(null)}>Retirer</button>}
    </div>
  );
}
