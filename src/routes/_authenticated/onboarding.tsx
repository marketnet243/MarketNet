import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Rocket,
  Store,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Package,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import {
  IdentityFields,
  ContactFields,
  AppearanceFields,
  emptyDraft,
  type ShopDraft,
} from "@/components/dashboard/ShopFields";
import { ShopPreview } from "@/components/dashboard/ShopPreview";
import { draftToRow, validateDraft, friendlyDbError } from "@/lib/shopDraft";
import { SLUG_RE, WHATSAPP_RE } from "@/lib/marketnet";
import { useMyShop } from "@/hooks/useMyShop";
import { useServerFn } from "@tanstack/react-start";
import { notifyMerchantWelcome } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Créer ma boutique — MarketNet" },
      { name: "description", content: "Assistant de création de boutique en ligne sur MarketNet." },
      { property: "og:title", content: "Créer ma boutique — MarketNet" },
      { property: "og:description", content: "Assistant de création de boutique MarketNet." },
    ],
  }),
  component: Onboarding,
});

const STEPS = ["Votre boutique", "Contact", "Apparence"];

function Onboarding() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ShopDraft>(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    name: string;
    slug: string;
    ownerName: string;
    whatsapp?: string;
  } | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: shop } = useMyShop();
  const set = (p: Partial<ShopDraft>) => setDraft((d) => ({ ...d, ...p }));
  const sendWelcomeMail = useServerFn(notifyMerchantWelcome);

  // Redirection automatique uniquement si la boutique existait déjà avant l'arrivée sur l'onboarding
  useEffect(() => {
    if (shop && !createdSuccess) {
      navigate({ to: "/dashboard" });
    }
  }, [shop, createdSuccess, navigate]);

  // Décompte automatique et non bloquant vers le dashboard après création
  useEffect(() => {
    if (!createdSuccess) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate({ to: "/dashboard/produits" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [createdSuccess, navigate]);

  function next() {
    if (step === 0) {
      if (draft.name.trim().length < 2) return toast.error("Donnez un nom à votre boutique");
      if (!SLUG_RE.test(draft.slug)) return toast.error("Lien invalide (3 caractères minimum, lettres, chiffres ou tirets)");
    }
    if (step === 1 && !WHATSAPP_RE.test(draft.whatsapp)) {
      return toast.error("Numéro WhatsApp invalide (ex. +243812345678)");
    }
    setStep((s) => s + 1);
  }

  async function finish() {
    const err = validateDraft(draft);
    if (err) return toast.error(err);
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("shops").insert({ ...draftToRow(draft), owner_id: u.user!.id });
    setBusy(false);
    if (error) return toast.error(friendlyDbError(error.message));

    await qc.invalidateQueries({ queryKey: ["myShop"] });

    const userEmail = u.user?.email;
    const userName = u.user?.user_metadata?.full_name || draft.name;

    // Enregistrement des données de succès pour l'écran de bienvenue
    setSuccessData({
      name: draft.name,
      slug: draft.slug,
      ownerName: userName,
      whatsapp: draft.whatsapp || undefined,
    });
    setCreatedSuccess(true);
    toast.success("Votre boutique est officiellement en ligne 🎉");

    // Email de bienvenue commerçant (fire-and-forget, non bloquant)
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
  }

  function handleCopyLink() {
    if (!successData?.slug) return;
    const url = `${window.location.origin}/b/${successData.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Lien de votre boutique copié !");
    setTimeout(() => setCopied(false), 2500);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ÉCRAN DE SUCCÈS & BIENVENUE APRÈS CRÉATION DE LA BOUTIQUE
  // ══════════════════════════════════════════════════════════════════════════
  if (createdSuccess && successData) {
    const publicUrl = `${typeof window !== "undefined" ? window.location.origin : "https://appmarketnet.vercel.app"}/b/${successData.slug}`;

    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-primary/10 via-background to-orange-500/10 overflow-hidden">
        {/* Halos d'ambiance festive */}
        <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-primary/15 blur-[140px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-orange-500/15 blur-[150px] pointer-events-none" />

        {/* Particules légères décoratives sans dépendance externe */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[15%] left-[20%] text-2xl animate-bounce duration-1000 opacity-60">🎉</div>
          <div className="absolute top-[25%] right-[22%] text-2xl animate-pulse duration-700 opacity-60">✨</div>
          <div className="absolute bottom-[20%] left-[25%] text-2xl animate-pulse duration-1000 opacity-60">🚀</div>
          <div className="absolute bottom-[30%] right-[20%] text-2xl animate-bounce duration-700 opacity-60">⭐</div>
        </div>

        <div className="w-full max-w-[540px] relative z-10 py-6 animate-in fade-in zoom-in-95 duration-400">
          {/* Header Marque */}
          <div className="mb-6 flex items-center justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 transition-transform hover:scale-105 active:scale-95"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-2xl shadow-xl shadow-primary/30">
                M
              </span>
              <span className="text-2xl font-black tracking-tight text-foreground">
                Market<span className="text-primary">Net</span>
              </span>
            </Link>
          </div>

          {/* Card Principale de Bienvenue */}
          <div className="rounded-[2.5rem] border bg-card/95 backdrop-blur-xl p-7 sm:p-10 shadow-2xl shadow-primary/10 space-y-6 text-center">
            {/* Badge et Fusée animée */}
            <div className="space-y-3">
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl animate-pulse" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-primary via-primary/90 to-orange-500 text-primary-foreground shadow-xl shadow-primary/30">
                  <Rocket className="h-10 w-10 animate-in zoom-in-50 duration-300" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Boutique en ligne activée avec succès</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Bienvenue, {successData.ownerName} !
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                Votre boutique <strong className="text-foreground">« {successData.name} »</strong> est prête à conquérir vos premiers clients sur internet.
              </p>
            </div>

            {/* Carte URL de la boutique */}
            <div className="rounded-2xl border bg-muted/30 p-4 text-left space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                <span className="flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 text-primary" />
                  Lien public de votre boutique
                </span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Accessible au public
                </span>
              </div>

              <div className="flex items-center gap-2 bg-background border rounded-xl p-2.5">
                <span className="text-xs font-mono text-foreground truncate flex-1 select-all font-semibold">
                  {publicUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors shrink-0"
                  title="Copier le lien"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Points d'encouragement */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="rounded-xl border bg-muted/20 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                  <span>WhatsApp direct</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Les clients commandent directement sur votre WhatsApp.
                </p>
              </div>

              <div className="rounded-xl border bg-muted/20 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Package className="h-3.5 w-3.5 text-primary" />
                  <span>Prêt pour l'ajout</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Ajoutez vos premiers produits avec photos et prix en Franc Congolais.
                </p>
              </div>
            </div>

            {/* Décompte doux non bloquant */}
            <div className="rounded-xl bg-muted/40 border border-border/50 py-2.5 px-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
              <span>
                Redirection automatique vers votre gestionnaire dans <strong className="text-foreground">{countdown}s</strong>…
              </span>
            </div>

            {/* Boutons d'action immédiate (100% NON BLOQUANTS) */}
            <div className="pt-1 space-y-3">
              <Button
                onClick={() => navigate({ to: "/dashboard/produits" })}
                className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/25 gap-2 text-sm transition-transform hover:scale-[1.02] active:scale-95"
              >
                <span>Accéder à mon tableau de bord dès maintenant</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <a
                href={`/b/${successData.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors w-full py-1"
              >
                <Store className="h-3.5 w-3.5" />
                <span>Voir l'aperçu public de ma boutique</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ÉTAPES DU FORMULAIRE D'ONBOARDING
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-5">
        <Logo />
        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="max-w-xl">
            <div className="flex gap-2">
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    i <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="mt-4 text-sm font-semibold text-primary">Étape {step + 1} sur 3</p>
            <h1 className="mt-1 text-3xl font-extrabold">{STEPS[step]}</h1>
            <div className="mt-6">
              {step === 0 && <IdentityFields draft={draft} set={set} />}
              {step === 1 && <ContactFields draft={draft} set={set} />}
              {step === 2 && <AppearanceFields draft={draft} set={set} />}
            </div>
            <div className="sticky bottom-0 -mx-4 mt-8 flex gap-3 border-t bg-background/95 px-4 py-4 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:px-0">
              {step > 0 && (
                <Button variant="outline" size="lg" onClick={() => setStep((s) => s - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                </Button>
              )}
              {step < 2 ? (
                <Button variant="hero" size="lg" className="flex-1 font-bold" onClick={next}>
                  Continuer
                </Button>
              ) : (
                <Button
                  variant="hero"
                  size="lg"
                  className="flex-1 font-bold shadow-md"
                  onClick={finish}
                  disabled={busy}
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création en cours…
                    </>
                  ) : (
                    "Publier ma boutique"
                  )}
                </Button>
              )}
            </div>
          </div>
          <div className="hidden lg:block">
            <ShopPreview draft={draft} />
          </div>
        </div>
      </div>
    </div>
  );
}
