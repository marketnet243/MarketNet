import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, ImagePlus, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { THEMES, SHOP_CATEGORIES, PRESET_COLORS, mediaUrl, slugify, SLUG_RE } from "@/lib/marketnet";
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
  theme: "savane", primary_color: "#E8590C", currency: "USD",
};

type P = { draft: ShopDraft; set: (p: Partial<ShopDraft>) => void };

const sel = "flex h-12 w-full rounded-xl border border-input bg-card px-3 text-sm";

export function IdentityFields({ draft, set, slugLocked, currentSlug }: P & { slugLocked?: boolean; currentSlug?: string }) {
  const [slugState, setSlugState] = useState<"idle" | "checking" | "free" | "taken" | "error">("idle");
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
          onChange={(e) =>
            set({
              name: e.target.value,
              ...(slugLocked === undefined && !currentSlug ? { slug: slugify(e.target.value) } : {}),
            })
          }
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
              ? "border-green-600"
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
            onChange={(e) =>
              set({
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 42),
              })
            }
          />
          {isCurrentSlug && <Check className="mr-3 h-4 w-4 text-emerald-600 shrink-0" />}
          {!isLocked && slugState === "checking" && (
            <Loader2 className="mr-3 h-4 w-4 animate-spin text-muted-foreground shrink-0" />
          )}
          {!isLocked && slugState === "free" && <Check className="mr-3 h-4 w-4 text-green-600 shrink-0" />}
          {!isLocked && (slugState === "taken" || slugState === "error") && (
            <XCircle className="mr-3 h-4 w-4 text-destructive shrink-0" />
          )}
        </div>
        {!isLocked && slugState === "taken" && (
          <p className="text-xs font-medium text-destructive">Ce lien est déjà pris, choisissez-en un autre.</p>
        )}
        {!isLocked && slugState === "free" && (
          <p className="text-xs font-medium text-green-600">Ce lien est disponible.</p>
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
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <ImageField label="Logo" value={draft.logo_url} onChange={(v) => set({ logo_url: v })} square />
        <ImageField label="Bannière" value={draft.banner_url} onChange={(v) => set({ banner_url: v })} />
      </div>
      <Field label="Thème">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {THEMES.map((t) => (
            <button key={t.id} type="button" onClick={() => set({ theme: t.id })}
              className={cn("rounded-xl border-2 p-2 text-left transition", draft.theme === t.id ? "border-primary" : "border-transparent bg-card")}>
              <div className="flex h-10 overflow-hidden rounded-lg">{t.swatch.map((c) => <span key={c} className="flex-1" style={{ background: c }} />)}</div>
              <p className="mt-1.5 text-sm font-semibold">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </button>
          ))}
        </div>
      </Field>
      <Field label="Couleur principale">
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map((c) => (
            <button key={c} type="button" aria-label={c} onClick={() => set({ primary_color: c })}
              className="grid h-10 w-10 place-items-center rounded-full ring-offset-2 ring-offset-background" style={{ background: c, boxShadow: draft.primary_color === c ? `0 0 0 3px ${c}55` : undefined }}>
              {draft.primary_color === c && <Check className="h-4 w-4 text-primary-foreground mix-blend-difference" />}
            </button>
          ))}
          <input type="color" value={draft.primary_color} onChange={(e) => set({ primary_color: e.target.value.toUpperCase() })} className="h-10 w-10 cursor-pointer rounded-full border-0 bg-transparent" aria-label="Couleur personnalisée" />
        </div>
      </Field>
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
