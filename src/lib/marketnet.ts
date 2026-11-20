export const THEMES = [
  { id: "savane", name: "Épure Pro", desc: "Minimaliste, ultra clair & moderne", swatch: ["#FFFFFF", "#4F46E5", "#0F172A"] },
  { id: "minuit", name: "Élégance Sombre", desc: "Fond nuit luxueux, contrastes nets", swatch: ["#0F172A", "#818CF8", "#F8FAFC"] },
  { id: "boutique", name: "Atelier & Mode", desc: "Chic éditorial, typographie raffinée", swatch: ["#FAF8F5", "#C2410C", "#1C1917"] },
  { id: "marche", name: "Vitalité & Fresh", desc: "Lumineux, convivial et accueillant", swatch: ["#F0FDF4", "#059669", "#064E3B"] },
  { id: "pur", name: "Haute Couture", desc: "Noir & blanc pur, design galerie", swatch: ["#FFFFFF", "#18181B", "#71717A"] },
  { id: "oasis", name: "Tech & Futur", desc: "Bleu profond moderne, style studio", swatch: ["#F8FAFC", "#2563EB", "#1E293B"] },
] as const;

export const SHOP_PAGE_MODELS = [
  {
    id: "generaliste",
    name: "Boutique Généraliste",
    desc: "Recherche en vue, rayons visibles, meilleures ventes et réassurance client.",
    icon: "Store",
  },
  {
    id: "mode",
    name: "Mode & Tendance",
    desc: "Grandes tuiles de rayons, nouveautés en grille spacieuse, logo centré.",
    icon: "Sparkles",
  },
  {
    id: "beaute",
    name: "Beauté & Soins",
    desc: "Acheter par besoin, best-sellers en avant, avis et résultats visibles.",
    icon: "Heart",
  },
  {
    id: "vitrine",
    name: "Vitrine de Présentation",
    desc: "La page qui raconte avant de vendre : chiffres clés, services et atouts.",
    icon: "Layers",
  },
] as const;

export const SHOP_COLOR_PALETTES = [
  {
    name: "Indigo Moderne (Vytrini)",
    primary: "#4F46E5",
    accent: "#6366F1",
    bg: "#FFFFFF",
    card: "#F8FAFC",
  },
  {
    name: "Bleu Marine Tech",
    primary: "#1E3A8A",
    accent: "#3B82F6",
    bg: "#FFFFFF",
    card: "#F0F9FF",
  },
  {
    name: "Émeraude Prestige",
    primary: "#047857",
    accent: "#10B981",
    bg: "#FFFFFF",
    card: "#F0FDF4",
  },
  {
    name: "Terre de Sienne",
    primary: "#C2410C",
    accent: "#F97316",
    bg: "#FFFFFF",
    card: "#FFF7ED",
  },
  {
    name: "Rose Quartz Glamour",
    primary: "#BE185D",
    accent: "#EC4899",
    bg: "#FFFFFF",
    card: "#FDF2F8",
  },
  {
    name: "Noir Onyx Minimal",
    primary: "#18181B",
    accent: "#71717A",
    bg: "#FFFFFF",
    card: "#F4F4F5",
  },
] as const;

export const SHOP_FONTS = [
  { id: "sans", name: "Moderne (Geist / Inter)", preview: "Aa Bb Cc" },
  { id: "display", name: "Impact (Bricolage Grotesque)", preview: "Aa Bb Cc" },
  { id: "serif", name: "Luxe & Magazine (Playfair / Instrument)", preview: "Aa Bb Cc" },
] as const;

export const PRODUCT_GRID_STYLES = [
  {
    id: "grid-2",
    name: "Grille Standard (2 par ligne)",
    desc: "Équilibrée et familière, idéale pour tout type de catalogue",
  },
  {
    id: "grid-large",
    name: "Grandes Cartes Visuelles",
    desc: "Idéale pour la mode, les bijoux et les photos soignées",
  },
  {
    id: "list",
    name: "Liste Détaillée & Épurée",
    desc: "Parfaite pour restaurants, épiceries, pièces et menus",
  },
] as const;

export const SHOP_CATEGORIES = [
  "Mode & vêtements", "Beauté & cosmétiques", "Alimentation", "Électronique & téléphones",
  "Maison & décoration", "Restaurant & traiteur", "Artisanat", "Santé & pharmacie", "Services", "Autre",
];

export const PRESET_COLORS = [
  "#4F46E5",
  "#1E3A8A",
  "#047857",
  "#C2410C",
  "#BE185D",
  "#18181B",
  "#0284C7",
  "#7C3AED",
];

export function formatPrice(n: number, currency: string) {
  if (currency === "MIXTE") return "Montant mixte";
  if (currency === "CDF") return `${Math.round(n).toLocaleString("fr-FR")} FC`;
  if (currency === "FCFA" || currency === "XOF" || currency === "XAF") return `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
  if (currency === "EUR") return `${n.toLocaleString("fr-FR", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })} €`;
  if (currency === "USD") return `${n.toLocaleString("fr-FR", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })} $`;
  
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })} ${currency}`;
}

export function slugify(s: string) {
  return s
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "") // Supprime les espaces ("landry store" -> "landrystore")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
}

export type ShopThemeSettings = {
  theme: string;
  model: "generaliste" | "mode" | "beaute" | "vitrine" | string;
  font: "sans" | "display" | "serif" | string;
  grid: "grid-2" | "grid-large" | "list" | string;
};

export function parseShopTheme(raw?: string | null): ShopThemeSettings {
  const defaults: ShopThemeSettings = {
    theme: "savane",
    model: "generaliste",
    font: "sans",
    grid: "grid-2",
  };
  if (!raw) return defaults;
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        theme: parsed.theme || defaults.theme,
        model: parsed.model || defaults.model,
        font: parsed.font || defaults.font,
        grid: parsed.grid || defaults.grid,
      };
    } catch {
      return defaults;
    }
  }
  return { ...defaults, theme: trimmed };
}

export function serializeShopTheme(
  settings: Partial<ShopThemeSettings>,
  existingRaw?: string | null
): string {
  const current = parseShopTheme(existingRaw);
  return JSON.stringify({
    ...current,
    ...settings,
  });
}

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,40}[a-z0-9]$/;
export const WHATSAPP_RE = /^\+[1-9][0-9]{7,14}$/;

export function mediaUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `/api/public/media/${path}`;
}

/**
 * Resolves a reliable public base origin (never returns localhost in SSR when deployed).
 */
export function resolvePublicOrigin(reqUrl?: string | null, forwardedHost?: string | null, forwardedProto?: string | null): string {
  if (forwardedHost && !forwardedHost.includes("localhost") && !forwardedHost.includes("127.0.0.1")) {
    const proto = forwardedProto || "https";
    return `${proto}://${forwardedHost}`.replace(/\/+$/, "");
  }
  const envUrl = (process.env["MARKETNET_SITE_URL"] || process.env["VITE_PUBLIC_URL"] || "").trim();
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl.replace(/\/+$/, "");
  }
  if (reqUrl) {
    try {
      const u = new URL(reqUrl);
      if (!u.hostname.includes("localhost") && !u.hostname.includes("127.0.0.1")) {
        return u.origin.replace(/\/+$/, "");
      }
    } catch { /* noop */ }
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }
  return "https://appmarketnet.vercel.app";
}

/**
 * Returns a fully qualified public URL for an image, required for og:image / twitter:image.
 * Falls back to platform assets if no custom image, ensuring link previews always render.
 */
export function absoluteMediaUrl(
  path: string | null | undefined,
  origin?: string | null,
  fallback?: string,
): string | null {
  const raw = path || fallback || null;
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  const cleanOrigin = (origin && !origin.includes("localhost") && !origin.includes("127.0.0.1"))
    ? origin.replace(/\/+$/, "")
    : (process.env["MARKETNET_SITE_URL"] || process.env["VITE_PUBLIC_URL"] || "https://appmarketnet.vercel.app").replace(/\/+$/, "");

  if (raw.startsWith("/")) {
    return `${cleanOrigin}${raw}`;
  }
  return `${cleanOrigin}/api/public/media/${raw}`;
}

/** Pick readable foreground for a hex color */
export function contrastOn(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160 ? "#111111" : "#ffffff";
}

export function shopStyle(primary: string): React.CSSProperties {
  return { ["--shop-primary" as string]: primary, ["--shop-primary-foreground" as string]: contrastOn(primary) };
}

export type Variant = { name: string; options: string[] };

/**
 * Libellé affichable d'une catégorie de boutique.
 * Si la catégorie est « Autre », affiche le texte personnalisé (category_custom) s'il est renseigné,
 * sinon retombe sur « Autre ».
 */
export function getShopCategoryLabel(
  shop?: { category?: string | null; category_custom?: string | null } | null
): string {
  if (!shop) return "";
  const cat = shop.category?.trim() || "";
  if (cat.toLowerCase() === "autre") {
    const custom = shop.category_custom?.trim();
    return custom || "Autre";
  }
  return cat;
}
