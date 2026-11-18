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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

const ASSISTANT_STEPS = [
  "Création de l'identité de votre boutique",
  "Génération de la vitrine en ligne",
  "Liaison du canal de commande WhatsApp",
  "Configuration du catalogue et du panier",
  "Finalisation de votre espace commerçant",
];

function getInitials(name: string): string {
  if (!name.trim()) return "M";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function Onboarding() {
  const [step, setStep] = useState(0); // 0 = Bienvenue
  const [draft, setDraft] = useState<ShopDraft>(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [creationStepIndex, setCreationStepIndex] = useState(0);
  const [creationProgress, setCreationProgress] = useState(10);
  const [slugState, setSlugState] = useState<"idle" | "checking" | "free" | "taken">("idle");
  const checkId = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: shop } = useMyShop();
  const set = (p: Partial<ShopDraft>) => setDraft((d) => ({ ...d, ...p }));
  const sendWelcomeMail = useServerFn(notifyMerchantWelcome);
  const signUpload = useServerFn(cloudinaryUploadSignature);

  // Redirection automatique si le commerçant a déjà une boutique
  useEffect(() => {
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
    setStep((s) => s + 1);
  }

  // Animation et construction de la boutique par l'assistant intelligent
  async function handleConfirmAndLaunch() {
    const err = validateDraft(draft);
    if (err) return toast.error(err);

    setBusy(true);
    setLaunching(true);
    setCreationStepIndex(0);
    setCreationProgress(15);

    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Session expirée, veuillez vous reconnecter");

      // Lancement de la requête Supabase en arrière-plan
      const insertPromise = supabase.from("shops").insert({
        ...draftToRow(draft),
        owner_id: u.user.id,
      });

      // Progression animée intelligente étape par étape (~4.2 secondes)
      // Étape 1
      await new Promise((r) => setTimeout(r, 800));
      setCreationStepIndex(1);
      setCreationProgress(35);

      // Étape 2
      await new Promise((r) => setTimeout(r, 900));
      setCreationStepIndex(2);
      setCreationProgress(60);

      // Étape 3
      await new Promise((r) => setTimeout(r, 900));
      setCreationStepIndex(3);
      setCreationProgress(80);

      // Attente de la validation base de données
      const { error } = await insertPromise;
      if (error) throw new Error(friendlyDbError(error.message));

      await qc.invalidateQueries({ queryKey: ["myShop"] });

      // Étape 4 : Finalisation
      await new Promise((r) => setTimeout(r, 800));
      setCreationStepIndex(4);
      setCreationProgress(100);

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

      // Petite pause de satisfaction (succès complet) puis redirection fluide
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Boutique créée avec succès !");
      navigate({ to: "/dashboard" });
    } catch (e) {
      setBusy(false);
      setLaunching(false);
      toast.error((e as Error).message);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ÉCRAN DE L'ASSISTANT INTELLIGENT DE CRÉATION EN DIRECT (STYLE VYTRINI)
  // ══════════════════════════════════════════════════════════════════════════
  if (launching && busy) {
    return (
      <div className="min-h-screen bg-linear-to-b from-background via-muted/20 to-background flex flex-col justify-center items-center px-4 py-12 select-none">
        <div className="w-full max-w-md bg-card/95 backdrop-blur-md border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-7 transition-all">
          
          <div className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 shadow-inner">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <span className="inline-block text-[11px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-3 py-0.5 rounded-full">
              Assistant MarketNet
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {creationProgress === 100 ? "Votre boutique est prête !" : "Création de votre boutique..."}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {creationProgress === 100
                ? "Redirection vers votre espace commerçant…"
                : <>Nous configurons la vitrine pour <strong>{draft.name}</strong>.</>}
            </p>
          </div>

          {/* Barre de progression fluide */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">Progression</span>
              <span className="text-primary font-mono font-bold">{creationProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-700 ease-out rounded-full"
                style={{ width: `${creationProgress}%` }}
              />
            </div>
          </div>

          {/* Checklist dynamique en direct */}
          <div className="space-y-3 pt-1 border-t border-border/60">
            {ASSISTANT_STEPS.map((label, idx) => {
              const isCompleted = idx < creationStepIndex || creationProgress === 100;
              const isCurrent = idx === creationStepIndex && creationProgress < 100;

              return (
                <div
                  key={label}
                  className={cn(
                    "flex items-center gap-3 text-xs sm:text-sm transition-all duration-300",
                    isCompleted
                      ? "text-foreground font-medium"
                      : isCurrent
                      ? "text-primary font-semibold"
                      : "text-muted-foreground/40 font-normal"
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      isCompleted
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : isCurrent
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground/30"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-3 w-3 stroke-[3]" />
                    ) : isCurrent ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </div>
                  <span className="truncate">
                    {idx === 0 && `Identité de « ${draft.name} »`}
                    {idx === 1 && `Génération de marketnet/b/${draft.slug}`}
                    {idx === 2 && `Connexion WhatsApp (${draft.whatsapp})`}
                    {idx === 3 && `Configuration du catalogue (${draft.city || "Kinshasa"})`}
                    {idx === 4 && `Finalisation de votre espace`}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-center text-muted-foreground pt-1">
            {creationProgress === 100
              ? "Ouverture du tableau de bord..."
              : "Veuillez patienter quelques instants, votre vitrine s'initialise…"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header minimaliste avec barre de progression */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
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
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${(step / TOTAL_CONFIG_STEPS) * 100}%` }}
            />
          </div>
        )}
      </header>

      {/* Contenu centré épuré */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-lg space-y-8">

          {/* ── ÉCRAN 0 : BIENVENUE (STYLE VYTRINI) ── */}
          {step === 0 && (
            <div className="space-y-8 text-center sm:text-left">
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
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
                  onClick={() => setStep(1)}
                  className="w-full h-12 rounded-xl text-sm font-semibold cursor-pointer gap-2 transition-transform active:scale-98"
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
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
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
                        slug: slugify(name),
                      });
                    }}
                    className="h-12 rounded-xl bg-background border-input text-base font-medium px-4 focus-visible:ring-1 focus-visible:ring-primary"
                    autoFocus
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
                      className="h-full flex-1 bg-transparent outline-none font-medium text-foreground truncate px-1 text-sm"
                      value={draft.slug}
                      onChange={(e) =>
                        set({
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 42),
                        })
                      }
                      placeholder="nom-de-boutique"
                    />
                    {slugState === "checking" && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
                    )}
                    {slugState === "free" && (
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    )}
                  </div>
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
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
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
                    <button
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
                    </button>
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
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          {/* ── ÉTAPE 3 : DESCRIPTION PROPRE ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
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
                  autoFocus
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
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
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
                    autoFocus
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
                      <button
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
                      </button>
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
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
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
                      <button
                        type="button"
                        onClick={() => set({ logo_url: null })}
                        className="absolute -top-2 -right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground shadow-sm hover:opacity-90 transition-opacity"
                        title="Retirer le logo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-2xl bg-muted/60 border border-border flex flex-col items-center justify-center text-muted-foreground">
                      <span className="text-2xl font-black text-foreground/80 tracking-wider">
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
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Vérifiez votre boutique
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tout est prêt. Confirmez vos informations pour lancer la création de votre espace par l'assistant.
                </p>
              </div>

              {/* Carte récapitulative épurée */}
              <div className="bg-muted/20 border border-border/80 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
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

                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <span className="text-xs text-muted-foreground">Lien de la boutique</span>
                  <span className="text-xs font-medium font-mono text-primary truncate max-w-[220px]">
                    marketnet/b/{draft.slug}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-border/60">
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

                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <span className="text-xs text-muted-foreground">Commandes WhatsApp</span>
                  <span className="text-sm font-semibold text-foreground font-mono">{draft.whatsapp}</span>
                </div>

                <div className={cn("flex items-center justify-between", draft.hours && "pb-3 border-b border-border/60")}>
                  <span className="text-xs text-muted-foreground">Zone de vente</span>
                  <span className="text-sm text-foreground">
                    {draft.city || "Kinshasa"}
                  </span>
                </div>

                {draft.hours && (
                  <div className="flex items-center justify-between">
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
                  className="w-full h-12 rounded-xl text-sm font-semibold cursor-pointer gap-2 transition-transform active:scale-98"
                >
                  <span>Confirmer et créer ma boutique</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Navigation sobre en bas (pour les étapes 1 à 6) */}
          {step > 0 && (
            <div className="pt-6 border-t border-border/60 flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep((s) => s - 1)}
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
      </main>
    </div>
  );
}
