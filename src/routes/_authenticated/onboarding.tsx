import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Upload,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  Store,
} from "lucide-react";
import { supabase } from "@/lib/imported-database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/Logo";
import { type ShopDraft, emptyDraft } from "@/components/dashboard/ShopFields";
import { draftToRow, validateDraft, friendlyDbError } from "@/lib/shopDraft";
import { SLUG_RE, WHATSAPP_RE, slugify, mediaUrl } from "@/lib/marketnet";
import { useMyShop } from "@/hooks/useMyShop";
import { useServerFn } from "@tanstack/react-start";
import { notifyMerchantWelcome } from "@/lib/admin.functions";
import { compressAndUpload } from "@/lib/upload";
import { cloudinaryUploadSignature } from "@/lib/cloudinary.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Configuration de votre boutique — MarketNet" },
      { property: "og:description", content: "Configurez votre boutique en ligne MarketNet en quelques étapes simples." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Configuration de votre boutique — MarketNet" },
      { name: "description", content: "Configurez votre boutique en ligne MarketNet en quelques étapes simples." },
    ],
  }),
  component: Onboarding,
});

const SECTORS = [
  "Mode & Habillement",
  "Électronique & Téléphonie",
  "Beauté & Cosmétiques",
  "Alimentation & Épicerie",
  "Restauration & Fast-food",
  "Maison & Décoration",
  "Santé & Bien-être",
  "Autre commerce",
];

const TOTAL_CONFIG_STEPS = 6;

function getInitials(name: string): string {
  if (!name.trim()) return "M";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function Onboarding() {
  const [step, setStep] = useState(0); // 0 = Bienvenue — sera restauré depuis Supabase
  const [stepRestored, setStepRestored] = useState(false);
  const [draft, setDraft] = useState<ShopDraft>(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [creationStepIndex, setCreationStepIndex] = useState(0);
  const [creationProgress, setCreationProgress] = useState(0);
  const [slugState, setSlugState] = useState<"idle" | "checking" | "free" | "taken">("idle");
  const [autoSlug, setAutoSlug] = useState(true);
  const checkId = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: shop } = useMyShop();
  const set = (p: Partial<ShopDraft>) => setDraft((d) => ({ ...d, ...p }));
  const sendWelcomeMail = useServerFn(notifyMerchantWelcome);
  const signUpload = useServerFn(cloudinaryUploadSignature);

  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (step === 0) return;
    stageRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [step]);

  // ── Restauration de l'étape depuis Supabase (cross-device) ──
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const saved = data?.user?.user_metadata?.onboarding_step;
      if (typeof saved === 'number' && saved > 0) {
        setStep(saved);
      }
      setStepRestored(true);
    });
  }, []);

  // ── Sauvegarde automatique de l'étape dans Supabase ──
  const persistStep = async (s: number) => {
    await supabase.auth.updateUser({ data: { onboarding_step: s } });
  };

  // Redirection automatique si le commerçant a déjà une boutique ou est admin
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
        if (isAdmin) {
          navigate({ to: "/admin" });
          return;
        }
      }
    });

    if (shop && !launching) {
      navigate({ to: "/dashboard" });
    }
  }, [shop, launching, navigate]);

  // Vérification en direct de la disponibilité de l'URL
  useEffect(() => {
    if (!draft.slug || !SLUG_RE.test(draft.slug)) {
      setSlugState("idle");
      return;
    }
    setSlugState("checking");
    const id = ++checkId.current;
    const t = setTimeout(async () => {
      try {
        const { data } = await supabase.rpc("slug_available", { _slug: draft.slug });
        if (id !== checkId.current) return;
        setSlugState(data ? "free" : "taken");
      } catch {
        if (id !== checkId.current) return;
        setSlugState("idle");
      }
    }, 400);
    return () => clearTimeout(t);
  }, [draft.slug]);

  // Upload du logo en 1 clic
  async function handleLogoUpload(file?: File) {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await compressAndUpload(file, "storefront", signUpload, 512);
      set({ logo_url: url });
      toast.success("Logo importé avec succès");
    } catch (err) {
      toast.error((err as Error).message || "Erreur lors de l'import du logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  function next() {
    if (step === 1) {
      if (draft.name.trim().length < 2) {
        return toast.error("Veuillez indiquer le nom de votre boutique");
      }
      if (!SLUG_RE.test(draft.slug)) {
        return toast.error("Lien invalide (lettres, chiffres ou tirets)");
      }
      if (slugState === "taken") {
        return toast.error("Ce lien est déjà pris, veuillez en choisir un autre");
      }
    }
    if (step === 2) {
      if (!draft.category) {
        return toast.error("Veuillez sélectionner votre secteur d'activité");
      }
    }
    if (step === 4) {
      if (!WHATSAPP_RE.test(draft.whatsapp.trim())) {
        return toast.error("Numéro WhatsApp invalide (format : +243XXXXXXXXX)");
      }
    }
    setStep((s) => {
      const next = s + 1;
      persistStep(next);
      return next;
    });
  }

  // Durée « intelligente » : chaque étape prend un temps proportionnel à ce qu'elle configure.
  function plannedDurations(d: ShopDraft): number[] {
    const descLen = (d.description || "").length;
    return [
      700 + (d.logo_url ? 350 : 0),
      750 + Math.min(d.slug.length * 15, 300),
      650,
      700 + Math.min(descLen * 2, 450),
      600,
    ];
  }

  // Lissage continu de la progression vers la cible de l'étape en cours.
  const [progressTarget, setProgressTarget] = useState(0);
  const [launchDone, setLaunchDone] = useState(false);
  useEffect(() => {
    if (!launching) return;
    const id = window.setInterval(() => {
      setCreationProgress((p) => {
        const diff = progressTarget - p;
        if (Math.abs(diff) < 0.5) return progressTarget;
        return p + diff * 0.12;
      });
    }, 40);
    return () => window.clearInterval(id);
  }, [launching, progressTarget]);

  useEffect(() => {
    if (!launchDone) return;
    const t = window.setTimeout(() => navigate({ to: "/dashboard" }), 2600);
    return () => window.clearTimeout(t);
  }, [launchDone, navigate]);

  async function handleConfirmAndLaunch() {
    const err = validateDraft(draft);
    if (err) return toast.error(err);

    setBusy(true);
    setLaunching(true);
    setLaunchDone(false);
    setCreationStepIndex(0);
    setCreationProgress(0);
    setProgressTarget(12);

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const durations = plannedDurations(draft);
    const targets = [22, 44, 64, 86, 100];

    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Session expirée, veuillez vous reconnecter");

      const insertPromise = supabase.from("shops").insert({
        ...draftToRow(draft),
        owner_id: u.user.id,
      });

      for (let i = 0; i < 3; i++) {
        setCreationStepIndex(i);
        setProgressTarget(targets[i]);
        await wait(durations[i]);
      }
      // Étape 4 : on attend la vraie confirmation de la base, avec un temps minimum.
      setCreationStepIndex(3);
      setProgressTarget(targets[3] - 6);
      const [{ error }] = await Promise.all([insertPromise, wait(durations[3])]);
      if (error) throw new Error(friendlyDbError(error.message));
      setProgressTarget(targets[3]);
      await qc.invalidateQueries({ queryKey: ["myShop"] });

      setCreationStepIndex(4);
      setProgressTarget(100);
      await wait(durations[4]);

      const userEmail = u.user?.email;
      const userName = u.user?.user_metadata?.full_name || draft.name;
      if (userEmail) {
        sendWelcomeMail({
          data: {
            merchantEmail: userEmail,
            merchantName: userName,
            shopName: draft.name,
            shopSlug: draft.slug,
            whatsapp: draft.whatsapp || undefined,
            planName: "Gratuit",
          },
        }).catch(() => {});
      }

      setCreationStepIndex(5);
      setCreationProgress(100);
      // Effacer l'étape sauvegardée — l'onboarding est terminé
      await supabase.auth.updateUser({ data: { onboarding_step: null } });
      setLaunchDone(true);
    } catch (e) {
      setBusy(false);
      setLaunching(false);
      setProgressTarget(0);
      toast.error((e as Error).message);
    }
  }

  // ══════════════ Loader pendant restauration de l'étape ══════════════
  if (!stepRestored) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-60" />
      </div>
    );
  }

  // ══════════════ Écran de l'assistant de création ══════════════
  if (launching && busy) {
    const pct = Math.round(creationProgress);
    const R = 40;
    const C = 2 * Math.PI * R;
    const stepLabels = [
      `Identité de « ${draft.name} »`,
      `Création du lien marketnet/b/${draft.slug}`,
      `Connexion WhatsApp${draft.whatsapp ? ` (${draft.whatsapp})` : ""}`,
      `Préparation du catalogue et du panier`,
      `Finalisation de votre espace`,
    ];
    const reached = (i: number) => launchDone || creationStepIndex >= i;
    return (
      <div className="launch-screen" role="status" aria-live="polite">
        <div className="launch-card">
          <div className="launch-orb" data-done={launchDone}>
            <svg className="launch-ring" viewBox="0 0 88 88" aria-hidden="true">
              <circle className="launch-ring-track" cx="44" cy="44" r={R} fill="none" strokeWidth="4" />
              <circle className="launch-ring-fill" cx="44" cy="44" r={R} fill="none" strokeWidth="4" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - creationProgress / 100)} />
            </svg>
            <div className="launch-orb-core">{launchDone ? <Check strokeWidth={3} /> : <Store />}</div>
          </div>

          <div className="text-center">
            <p className="text-xs font-semibold text-primary">Assistant MarketNet · {pct}%</p>
            <h1 className="mt-2 text-2xl font-bold text-foreground">
              {launchDone ? "Votre boutique est en ligne !" : "Nous créons votre boutique"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {launchDone
                ? <>« {draft.name} » est prête à recevoir ses premières commandes.</>
                : stepLabels[Math.min(creationStepIndex, 4)] + "…"}
            </p>
          </div>

          <div className="launch-preview" aria-hidden="true">
            <div className="launch-preview-cover" />
            <div className="launch-preview-body">
              <div className="launch-preview-logo">
                {draft.logo_url ? <img src={mediaUrl(draft.logo_url) ?? undefined} alt="" /> : getInitials(draft.name)}
              </div>
              <div className="mt-3 space-y-2">
                {reached(0) ? <p className="launch-reveal font-semibold text-foreground truncate" data-on="true">{draft.name}</p> : <div className="launch-skeleton w-1/2" />}
                {reached(1) ? <p className="launch-reveal text-xs text-primary truncate" data-on="true">marketnet/b/{draft.slug}</p> : <div className="launch-skeleton w-2/3" />}
              </div>
              <div className="launch-products" data-on={reached(3)}><span /><span /><span /></div>
            </div>
          </div>

          {launchDone ? (
            <div className="grid gap-2">
              <Button size="lg" className="w-full rounded-full" onClick={() => navigate({ to: "/dashboard" })}>
                Ouvrir mon tableau de bord <ArrowRight />
              </Button>
              <p className="text-center text-xs text-muted-foreground">Ouverture automatique dans un instant…</p>
            </div>
          ) : (
            <div className="launch-steps">
              {stepLabels.map((label, idx) => {
                const state = idx < creationStepIndex ? "done" : idx === creationStepIndex ? "current" : "todo";
                return (
                  <div key={idx} className="launch-step" data-state={state}>
                    <span className="launch-step-dot">
                      {state === "done" ? <Check strokeWidth={3} /> : state === "current" ? <Loader2 className="animate-spin" /> : null}
                    </span>
                    <span className="truncate">{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-page">
      {/* Header minimaliste avec barre de progression */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto max-w-5xl px-5 py-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <Logo />
          {step > 0 && (
            <span className="text-xs font-medium text-muted-foreground">
              Étape {step} sur {TOTAL_CONFIG_STEPS}
            </span>
          )}
        </div>
        {/* Ligne de progression fine */}
        {step > 0 && (
          <div className="h-0.5 w-full bg-muted">
            <div
              className="onboarding-progress-fill h-full bg-primary ease-out"
              style={{ width: `${(step / TOTAL_CONFIG_STEPS) * 100}%` }}
            />
          </div>
        )}
      </header>

      {/* Contenu centré épuré */}
      <main className="flex-1 flex flex-col items-center px-5 py-6 sm:py-8">
        <div className="onboarding-layout">
          <aside className="onboarding-sidebar" aria-label="Configuration de la boutique">
            <ol>{['Bienvenue', 'Nom et lien', 'Secteur d’activité', 'Description', 'Contact et horaires', 'Logo', 'Vérification'].map((label, index) => <li key={label} data-current={index === step} aria-current={index === step ? 'step' : undefined}><span>{index < step ? <Check /> : index === 0 ? <Sparkles /> : index}</span>{label}</li>)}</ol>
            <p className="onboarding-sidebar-note">Votre boutique prend forme.<br />Vos informations restent modifiables.</p>
          </aside>
        <div className="onboarding-content space-y-8">

          <div key={step} className="onboarding-stage" ref={stageRef} tabIndex={-1}>

          {/* ── ÉCRAN 0 : BIENVENUE (STYLE VYTRINI) ── */}
          {step === 0 && (
            <div className="space-y-8 text-center sm:text-left">
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-normal text-foreground">
                  Bienvenue sur MarketNet
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Configurons ensemble votre boutique en ligne. En quelques minutes, vos clients pourront consulter vos produits et commander directement sur WhatsApp.
                </p>
              </div>

              {/* Points clés sobres */}
              <div className="space-y-3.5 border-t border-b border-border/60 py-6 text-left">
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Configuration en 2 minutes</p>
                    <p className="text-xs text-muted-foreground">Aucune compétence technique requise, l'assistant vous guide.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Commandes directes sur WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Chaque vente arrive pré-remplie avec les détails du produit sur votre numéro.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Catalogue modifiable à tout moment</p>
                    <p className="text-xs text-muted-foreground">Vous pourrez ajouter, modifier ou retirer des produits quand vous le souhaitez.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  size="lg"
                  onClick={() => { setStep(1); persistStep(1); }}
                  className="w-full h-12 rounded-xl text-sm font-semibold cursor-pointer gap-2 transition-transform "
                >
                  <span>Commencer la configuration</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 1 : NOM & LIEN COMMERCIAL ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-normal text-foreground">
                  Comment s'appelle votre boutique ?
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Choisissez un nom clair pour vos clients. Vous pourrez le modifier à tout moment.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="shop-name" className="text-xs font-medium text-foreground">
                    Nom commercial de la boutique
                  </Label>
                  <Input
                    id="shop-name"
                    placeholder="Ex. Maison Ébène, Kivu Tech…"
                    value={draft.name}
                    maxLength={80}
                    onChange={(e) => {
                      const name = e.target.value;
                      set({
                        name,
                        ...(autoSlug ? { slug: slugify(name) } : {}),
                      });
                    }}
                    className="h-12 rounded-xl bg-background border-input text-base font-medium px-4 focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>

                {/* Lien public attribué */}
                <div className="space-y-1.5">
                  <Label htmlFor="shop-slug" className="text-xs font-medium text-muted-foreground">
                    Lien public attribué
                  </Label>
                  <div className="flex items-center h-11 rounded-xl border border-input bg-muted/20 px-3 text-sm">
                    <span className="text-muted-foreground select-none shrink-0 font-normal">
                      marketnet/b/
                    </span>
                    <input
                      id="shop-slug"
                      className="h-full min-w-0 flex-1 bg-transparent outline-none font-medium text-foreground truncate px-1 text-sm"
                      value={draft.slug}
                      onChange={(e) => {
                        setAutoSlug(false);
                        set({
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 42),
                        });
                      }}
                      placeholder="nom-de-boutique"
                    />
                    {slugState === "checking" && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
                    )}
                    {slugState === "free" && (
                      <Check className="h-3.5 w-3.5 text-success shrink-0" />
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none pt-1">
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
                      className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>Générer automatiquement le lien depuis le nom</span>
                  </label>
                  {slugState === "taken" && (
                    <p className="text-xs text-destructive">Ce lien est déjà pris, vous pouvez le modifier.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 : SECTEUR D'ACTIVITÉ ── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-normal text-foreground">
                  Quel est votre secteur d'activité ?
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sélectionnez la catégorie qui décrit le mieux les articles que vous vendez.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {SECTORS.map((sector) => {
                  const isSelected = draft.category === sector;
                  return (
                    <Button variant="ghost"
                      key={sector}
                      type="button"
                      onClick={() =>
                        set({
                          category: sector,
                          ...(sector !== "Autre commerce" ? { category_custom: "" } : {}),
                        })
                      }
                      className={cn(
                        "h-12 px-4 rounded-xl border text-sm font-medium text-left transition-all cursor-pointer flex items-center justify-between",
                        isSelected
                          ? "border-primary bg-primary/5 text-foreground font-semibold shadow-xs"
                          : "border-border/70 bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="truncate">{sector}</span>
                      {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                    </Button>
                  );
                })}
              </div>

              {draft.category === "Autre commerce" && (
                <div className="pt-2">
                  <Input
                    placeholder="Précisez votre activité…"
                    value={draft.category_custom}
                    onChange={(e) => set({ category_custom: e.target.value })}
                    className="h-11 rounded-xl text-sm"
                                      />
                </div>
              )}
            </div>
          )}

          {/* ── ÉTAPE 3 : DESCRIPTION PROPRE ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-normal text-foreground">
                  Décrivez votre boutique
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Présentez en quelques phrases ce qui rend votre commerce unique. Ce texte sera affiché en haut de votre vitrine.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="shop-desc" className="text-xs font-medium text-foreground">
                  Courte description (facultatif mais recommandé)
                </Label>
                <Textarea
                  id="shop-desc"
                  rows={4}
                  maxLength={1000}
                  placeholder="Ex. Boutique spécialisée dans le prêt-à-porter haut de gamme et les accessoires tendance à Kinshasa. Livraison à domicile 7j/7."
                  value={draft.description}
                  onChange={(e) => set({ description: e.target.value })}
                  className="rounded-xl bg-background border-input text-sm p-4 leading-relaxed focus-visible:ring-1 focus-visible:ring-primary"
                                  />
                <div className="flex justify-end text-[11px] text-muted-foreground">
                  <span>{draft.description.length} / 1000 caractères</span>
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 4 : WHATSAPP & VILLE ── */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-normal text-foreground">
                  Où recevez-vous vos commandes ?
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Vos clients vous contacteront directement sur ce numéro WhatsApp pour valider leurs achats.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-xs font-medium text-foreground">
                    Numéro WhatsApp
                  </Label>
                  <Input
                    id="whatsapp"
                    inputMode="tel"
                    placeholder="+243812345678"
                    value={draft.whatsapp}
                    onChange={(e) => set({ whatsapp: e.target.value.replace(/[^\d+]/g, "") })}
                    className="h-12 rounded-xl bg-background border-input text-base font-medium px-4 focus-visible:ring-1 focus-visible:ring-primary"
                                      />
                  <p className="text-xs text-muted-foreground">
                    Format international requis (ex. +243 suivi de votre numéro).
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="city" className="text-xs font-medium text-foreground">
                    Ville principale (Zone de vente)
                  </Label>
                  <Input
                    id="city"
                    placeholder="Ex. Kinshasa, Lubumbashi, Goma…"
                    value={draft.city}
                    onChange={(e) => set({ city: e.target.value })}
                    className="h-11 rounded-xl bg-background border-input text-sm px-4"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hours" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span>Horaires d'ouverture</span>
                    </Label>
                    <span className="text-[11px] text-muted-foreground font-normal">Facultatif</span>
                  </div>
                  <Input
                    id="hours"
                    placeholder="Ex. Lun - Sam : 08h00 - 18h00"
                    value={draft.hours}
                    onChange={(e) => set({ hours: e.target.value })}
                    className="h-11 rounded-xl bg-background border-input text-sm px-4"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      "Lun - Sam : 08h00 - 18h00",
                      "24h/24 & 7j/7",
                      "Lun - Ven : 08h30 - 17h00",
                      "Sur commande uniquement",
                    ].map((preset) => (
                      <Button variant="ghost"
                        key={preset}
                        type="button"
                        onClick={() => set({ hours: draft.hours === preset ? "" : preset })}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer",
                          draft.hours === preset
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {preset}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Indiquez vos heures d'ouverture pour que vos clients sachent quand vous joindre. Vous pouvez aussi laisser vide.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 5 : LOGO & IMAGE DE MARQUE (NON-BLOQUANT) ── */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-normal text-foreground">
                  Ajoutez le logo de votre boutique
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Votre logo renforce la confiance de vos acheteurs. Si vous n'en avez pas sous la main, vous pouvez passer cette étape en un clic.
                </p>
              </div>

              {/* Zone d'import sobre et centrée */}
              <div className="border border-border/80 rounded-2xl p-6 bg-card text-center space-y-5">
                <div className="flex justify-center">
                  {draft.logo_url ? (
                    <div className="relative group">
                      <img
                        src={mediaUrl(draft.logo_url) || draft.logo_url}
                        alt="Logo de la boutique"
                        className="h-28 w-28 rounded-2xl object-cover border border-border shadow-xs"
                      />
                      <Button variant="ghost"
                        type="button"
                        onClick={() => set({ logo_url: null })}
                        className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground shadow-sm hover:opacity-90 transition-opacity"
                        title="Retirer le logo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-2xl bg-muted/60 border border-border flex flex-col items-center justify-center text-muted-foreground">
                      <span className="text-2xl font-black text-foreground/80 tracking-normal">
                        {getInitials(draft.name)}
                      </span>
                      <span className="text-[10px] mt-1 text-muted-foreground">Initiales auto</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="h-11 px-5 rounded-xl text-sm font-semibold cursor-pointer gap-2 border-border/80"
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Téléversement en cours…</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>{draft.logo_url ? "Remplacer le logo" : "Choisir une image"}</span>
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Format recommandé : PNG ou JPG carré (max 15 Mo).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 6 : CONFIRMATION & RÉCAPITULATIF (STYLE VYTRINI) ── */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-normal text-foreground">
                  Vérifiez votre boutique
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tout est prêt. Confirmez vos informations pour lancer la création de votre espace par l'assistant.
                </p>
              </div>

              {/* Carte récapitulative épurée */}
              <div className="bg-muted/20 border border-border/80 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="onboarding-summary-row pb-3 border-b border-border">
                  <span className="text-xs text-muted-foreground">Nom commercial</span>
                  <div className="flex items-center gap-2">
                    {draft.logo_url ? (
                      <img
                        src={mediaUrl(draft.logo_url) || draft.logo_url}
                        alt=""
                        className="h-6 w-6 rounded-md object-cover border border-border"
                      />
                    ) : (
                      <span className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-[10px] font-bold text-foreground">
                        {getInitials(draft.name)}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-foreground">{draft.name}</span>
                  </div>
                </div>

                <div className="onboarding-summary-row pb-3 border-b border-border">
                  <span className="text-xs text-muted-foreground">Lien de la boutique</span>
                  <span className="text-xs font-medium font-mono text-primary truncate max-w-[220px]">
                    marketnet/b/{draft.slug}
                  </span>
                </div>

                <div className="onboarding-summary-row pb-3 border-b border-border">
                  <span className="text-xs text-muted-foreground">Secteur</span>
                  <span className="text-sm text-foreground">{draft.category || "Commerce général"}</span>
                </div>

                {draft.description && (
                  <div className="pb-3 border-b border-border/60 space-y-1">
                    <span className="text-xs text-muted-foreground">Description</span>
                    <p className="text-xs text-foreground leading-relaxed line-clamp-2">
                      {draft.description}
                    </p>
                  </div>
                )}

                <div className="onboarding-summary-row pb-3 border-b border-border">
                  <span className="text-xs text-muted-foreground">Commandes WhatsApp</span>
                  <span className="text-sm font-semibold text-foreground font-mono">{draft.whatsapp}</span>
                </div>

                <div className={cn("onboarding-summary-row", draft.hours && "pb-3 border-b border-border/60")}>
                  <span className="text-xs text-muted-foreground">Zone de vente</span>
                  <span className="text-sm text-foreground">
                    {draft.city || "Kinshasa"}
                  </span>
                </div>

                {draft.hours && (
                  <div className="onboarding-summary-row">
                    <span className="text-xs text-muted-foreground">Horaires</span>
                    <span className="text-xs font-medium text-foreground truncate max-w-[220px]">
                      {draft.hours}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  size="lg"
                  onClick={handleConfirmAndLaunch}
                  disabled={busy}
                  className="w-full h-12 rounded-xl text-sm font-semibold cursor-pointer gap-2 transition-transform "
                >
                  <span>Confirmer et créer ma boutique</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          </div>
          {/* Navigation sobre en bas (pour les étapes 1 à 6) */}
          {step > 0 && (
            <div className="onboarding-controls pt-6 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((s) => { const prev = s - 1; persistStep(prev); return prev; })}
                className="h-11 px-4 text-sm text-muted-foreground hover:text-foreground font-medium cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Retour
              </Button>

              {step < 6 && (
                <Button
                  type="button"
                  onClick={next}
                  className="h-11 px-6 rounded-xl text-sm font-semibold cursor-pointer gap-2"
                >
                  <span>
                    {step === 5 && !draft.logo_url ? "Passer cette étape" : "Continuer"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}
