import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
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
  const [countdown, setCountdown] = useState(6);

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

  // ══════════════════════════════════════════════════════════════════════════
  // ÉCRAN DE SUCCÈS & BIENVENUE APRÈS CRÉATION DE LA BOUTIQUE
  // ══════════════════════════════════════════════════════════════════════════
  if (createdSuccess && successData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-primary/5 via-background to-orange-500/5">
        <div className="w-full max-w-[460px] py-6">
          {/* Header Marque MarketNet */}
          <div className="mb-6 flex items-center justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 transition-transform hover:scale-105 active:scale-95"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-warm text-primary-foreground font-black text-2xl shadow-xl shadow-primary/30">
                M
              </span>
              <span className="text-2xl font-black tracking-tight text-foreground">
                Market<span className="text-primary">Net</span>
              </span>
            </Link>
          </div>

          {/* Card Principale de Bienvenue */}
          <div className="rounded-[2rem] border bg-card/95 backdrop-blur-xl p-7 sm:p-9 shadow-2xl shadow-primary/5 text-center">
            <div className="space-y-6">
              {/* Badge de succès émeraude avec checkmark */}
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 blur-xl animate-pulse" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="h-10 w-10 animate-in zoom-in-75 duration-300" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Boutique créée avec succès</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  Bienvenue, {successData.ownerName} !
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  Votre boutique <strong className="text-foreground">« {successData.name} »</strong> est prête. Vous pouvez désormais ajouter vos produits et commencer à vendre.
                </p>
              </div>

              {/* Indicateur de décompte intelligent */}
              <div className="rounded-xl bg-muted/40 border border-border/50 p-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                <span>
                  Redirection automatique dans <strong className="text-foreground">{countdown}s</strong>…
                </span>
              </div>

              {/* Bouton d'action immédiate sans coupure */}
              <div className="pt-1 space-y-3">
                <Button
                  onClick={() => navigate({ to: "/dashboard/produits" })}
                  className="w-full h-11 rounded-xl font-bold shadow-lg shadow-primary/20 gap-2 transition-transform hover:scale-[1.02] active:scale-95 text-sm"
                >
                  <span>Accéder à mon tableau de bord</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Button>

                <a
                  href={`/b/${successData.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Voir l'aperçu de ma boutique
                </a>
              </div>
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
