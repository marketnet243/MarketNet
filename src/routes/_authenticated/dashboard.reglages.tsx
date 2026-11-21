import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  User,
  CreditCard,
  LogOut,
  CheckCircle2,
  Trash2,
  Loader2,
  Clock,
  ArrowRight,
  Package,
  Camera,
  Tag,
  Sparkles,
  Shield,
  Store,
  Mail,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Info,
  HelpCircle,
} from "lucide-react";
import { supabase } from "@/lib/imported-database";
import { getMerchantSubscription } from "@/lib/subscriptions.functions";
import {
  requestAccountDeletion,
  cancelAccountDeletion,
  getMyDeletionRequest,
  DELETION_REASONS,
} from "@/lib/account-deletion.functions";
import { useMyShop } from "@/hooks/useMyShop";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/reglages")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Paramètres du compte — MarketNet" },
      { property: "og:description", content: "Paramètres de votre profil commerçant, sécurité, abonnement et suppression." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Paramètres du compte — MarketNet" },
      { name: "description", content: "Paramètres de votre profil commerçant, sécurité, abonnement et suppression." },
    ],
  }),
  component: SettingsPage,
});

type SettingsTab = "profil" | "abonnement" | "securite" | "suppression";

function SettingsPage() {
  const { data: shop } = useMyShop();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profil");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // Demande de suppression
  const [showDeletionForm, setShowDeletionForm] = useState(false);
  const [deletionReason, setDeletionReason] = useState<string>("plus_besoin");
  const [deletionReasonOther, setDeletionReasonOther] = useState("");
  const [deletionComment, setDeletionComment] = useState("");
  const [confirmedRisk, setConfirmedRisk] = useState(false);
  const [submittingDeletion, setSubmittingDeletion] = useState(false);
  const [cancellingDeletion, setCancellingDeletion] = useState(false);

  const requestDeletionFn = useServerFn(requestAccountDeletion);
  const cancelDeletionFn = useServerFn(cancelAccountDeletion);
  const getMyRequestFn = useServerFn(getMyDeletionRequest);

  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const getSubFn = useServerFn(getMerchantSubscription);
  const { data: subLimits } = useQuery({
    queryKey: ["merchant-subscription-limits", shop?.id],
    enabled: !!shop?.id,
    queryFn: () => getSubFn({ data: { shopId: shop!.id } }),
  });

  const { data: activeDeletionRequest, refetch: refetchDeletionRequest } = useQuery({
    queryKey: ["my-deletion-request"],
    queryFn: () => getMyRequestFn(),
    staleTime: 30_000,
  });

  // Synchronisation avec l'URL (?tab=suppression etc.)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (
        tabParam === "profil" ||
        tabParam === "abonnement" ||
        tabParam === "securite" ||
        tabParam === "suppression"
      ) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  };

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  async function updateProfile() {
    if (!fullName.trim()) return toast.error("Le nom complet est requis");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() },
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profil mis à jour avec succès !");
    qc.invalidateQueries({ queryKey: ["auth-user"] });
  }

  async function handleRequestDeletion(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmedRisk) {
      toast.error("Veuillez cocher la case attestant avoir pris connaissance des conséquences.");
      return;
    }
    if (deletionReason === "autre" && !deletionReasonOther.trim()) {
      toast.error("Veuillez préciser la raison dans le champ 'Autre'.");
      return;
    }
    setSubmittingDeletion(true);
    try {
      await requestDeletionFn({
        data: {
          reason: deletionReason as any,
          reason_other: deletionReason === "autre" ? deletionReasonOther.trim() : undefined,
          comment: deletionComment.trim() || undefined,
        },
      });
      toast.success("Votre demande a été soumise avec succès. Vous recevrez un e-mail de confirmation.");
      setShowDeletionForm(false);
      setDeletionComment("");
      setDeletionReasonOther("");
      setConfirmedRisk(false);
      refetchDeletionRequest();
    } catch (err: any) {
      toast.error(err?.message || "Impossible de soumettre la demande.");
    } finally {
      setSubmittingDeletion(false);
    }
  }

  async function handleCancelDeletion() {
    setCancellingDeletion(true);
    try {
      await cancelDeletionFn();
      toast.success("Votre demande de suppression a été annulée avec succès.");
      refetchDeletionRequest();
    } catch (err: any) {
      toast.error(err?.message || "Impossible d'annuler la demande.");
    } finally {
      setCancellingDeletion(false);
    }
  }

  const currentPlanId = subLimits?.plan_id || shop?.plan_id || "free";
  const isGrace = subLimits?.is_grace_period;
  const isExpired = subLimits?.status === "expiré";

  const getReasonLabel = (reasonVal?: string) => {
    if (!reasonVal) return "Non précisé";
    const found = DELETION_REASONS.find((r) => r.value === reasonVal);
    return found ? found.label : reasonVal;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* ── En-tête officiel de la page ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Espace Commerçant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Paramètres du compte
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gérez vos informations de profil, votre formule d'abonnement, la sécurité et la suppression de votre compte.
          </p>
        </div>

        {shop?.slug && (
          <Link
            to="/b/$slug"
            params={{ slug: shop.slug }}
            target="_blank"
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full border border-border bg-card hover:bg-muted/50 px-4 py-2 text-xs font-bold text-foreground transition-all shadow-xs"
          >
            <Store className="h-4 w-4 text-primary" />
            <span>Voir ma vitrine</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </Link>
        )}
      </div>

      {/* ── Onglets de Navigation Principaux (Tabs alignés et fluides) ── */}
      <div className="flex items-center gap-1.5 p-1.5 bg-muted/50 rounded-2xl border border-border/80 w-full sm:w-auto overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => handleTabChange("profil")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-initial justify-center",
            activeTab === "profil"
              ? "bg-card text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          )}
        >
          <User className="h-4 w-4 text-primary" />
          <span>Profil & Identité</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("abonnement")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-initial justify-center",
            activeTab === "abonnement"
              ? "bg-card text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          )}
        >
          <CreditCard className="h-4 w-4 text-primary" />
          <span>Formule & Quotas</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("securite")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-initial justify-center",
            activeTab === "securite"
              ? "bg-card text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          )}
        >
          <Shield className="h-4 w-4 text-primary" />
          <span>Sécurité</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("suppression")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap flex-1 sm:flex-initial justify-center",
            activeTab === "suppression"
              ? "bg-card text-destructive shadow-xs border border-destructive/30"
              : "text-muted-foreground hover:text-destructive hover:bg-muted/30"
          )}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
          <span>Demande de suppression</span>
          {activeDeletionRequest && activeDeletionRequest.status === "pending" && (
            <span
              className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0"
              title="Demande de suppression en attente"
            />
          )}
        </button>
      </div>

      {/* ── CONTENU : ONGLET 1 - PROFIL & IDENTITÉ ── */}
      {activeTab === "profil" && (
        <section className="rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-lg shrink-0 shadow-md shadow-primary/20">
                {(fullName || shop?.name || "M").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-base text-foreground">
                    {fullName || "Commerçant MarketNet"}
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Vérifié
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Boutique rattachée : <strong className="text-foreground">{shop?.name || "Ma boutique"}</strong>
                </p>
              </div>
            </div>

            <Link
              to="/dashboard/boutique"
              className="inline-flex items-center gap-1.5 self-start sm:self-auto text-xs font-bold text-primary hover:underline"
            >
              <span>Personnaliser ma vitrine</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Nom complet */}
              <div className="space-y-1.5">
                <Label htmlFor="fullname" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                  Nom complet
                </Label>
                <input
                  id="fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Landry Kayoyo"
                  className="h-11 w-full rounded-2xl border border-border bg-muted/20 px-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Email de connexion */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    Adresse e-mail
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-semibold">Identifiant sécurisé</span>
                </div>
                <input
                  id="email"
                  value={email}
                  disabled
                  className="h-11 w-full rounded-2xl border border-border/60 bg-muted/50 text-muted-foreground cursor-not-allowed px-3.5 text-sm font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/60">
              <p className="text-xs text-muted-foreground">
                Votre nom apparaît sur les reçus de paiement et vos notifications officielles.
              </p>
              <Button
                type="button"
                onClick={updateProfile}
                disabled={saving}
                className="h-10 px-5 rounded-xl font-bold text-xs gap-2 shadow-xs"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                <span>Enregistrer</span>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ── CONTENU : ONGLET 2 - FORMULE & QUOTAS ── */}
      {activeTab === "abonnement" && (
        <section className="rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Formule en cours</span>
              <div className="flex items-center gap-2.5 mt-1">
                <h2 className="text-2xl font-black capitalize text-foreground">
                  Plan {subLimits?.plan_name || (currentPlanId === "pro" ? "Pro" : "Gratuit")}
                </h2>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider",
                  isGrace ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                  isExpired ? "bg-destructive/10 text-destructive border-destructive/20" :
                  currentPlanId === "pro" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                  "bg-muted text-muted-foreground border-border"
                )}>
                  {isGrace ? "Grâce" : isExpired ? "Expiré" : currentPlanId === "pro" ? "Actif" : "Gratuit"}
                </span>
              </div>
            </div>

            {subLimits?.ends_at && currentPlanId !== "free" && (
              <div className="text-left sm:text-right bg-muted/30 px-4 py-2.5 rounded-2xl border border-border/60 text-xs">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Échéance du plan</span>
                <strong className="text-foreground text-sm font-bold">
                  {new Date(subLimits.ends_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </strong>
              </div>
            )}
          </div>

          {/* Grille des quotas actuels */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase">
                <Package className="h-3.5 w-3.5 text-primary" /> Produits
              </span>
              <p className="text-lg font-black text-foreground">
                {subLimits?.max_products != null ? `${subLimits.max_products} max` : "Illimité"}
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase">
                <Camera className="h-3.5 w-3.5 text-primary" /> Photos / prod.
              </span>
              <p className="text-lg font-black text-foreground">
                {subLimits?.max_photos ?? 3} photos
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase">
                <Tag className="h-3.5 w-3.5 text-primary" /> Promotions
              </span>
              <p className="text-lg font-black text-foreground">
                {subLimits?.max_active_promotions != null ? `${subLimits.max_active_promotions} active(s)` : "Illimitées"}
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Fonctions Pro
              </span>
              <p className="text-lg font-black text-foreground">
                {subLimits?.advanced_stats ? "Débloquées" : "Standard"}
              </p>
            </div>
          </div>

          {/* Lien vers la page abonnement */}
          <Link
            to="/dashboard/abonnement"
            className="flex items-center justify-between w-full rounded-2xl bg-primary/5 hover:bg-primary/10 border border-primary/20 p-4 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <span className="text-foreground font-extrabold text-sm block">
                  Changer de formule, renouveler ou consulter les factures
                </span>
                <span className="text-muted-foreground text-xs">
                  Passez au Plan Pro à 3 $/mois (ou 30 $/an) avec paiement instantané via SasPay.
                </span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1 shrink-0 ml-3" />
          </Link>
        </section>
      )}

      {/* ── CONTENU : ONGLET 3 - SÉCURITÉ ── */}
      {activeTab === "securite" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Session active */}
          <section className="rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground shrink-0 border border-border/60">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-foreground">Sécurité de la session</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Connecté en tant que <strong className="text-foreground">{email}</strong>. Déconnectez votre session en toute sécurité sur cet appareil.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => supabase.auth.signOut().then(() => (window.location.href = "/auth"))}
              className="h-10 px-5 rounded-xl font-bold text-xs gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 shrink-0"
            >
              <LogOut className="h-4 w-4" />
              <span>Se déconnecter</span>
            </Button>
          </section>

          {/* Protection & Raccourci vers Demande de suppression */}
          <section className="rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-foreground">
                  Clôture & Suppression du compte
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Vous souhaitez fermer définitivement votre boutique et exercer votre droit à l'effacement de vos données ?
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              type="button"
              onClick={() => handleTabChange("suppression")}
              className="h-10 px-4 rounded-xl text-xs font-bold text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Aller à l'onglet Suppression</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </section>
        </div>
      )}

      {/* ── CONTENU : ONGLET 4 - DEMANDE DE SUPPRESSION ── */}
      {activeTab === "suppression" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* En-tête de la section suppression */}
          <section className="rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/60 pb-5">
              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shrink-0">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-black text-lg text-foreground">
                    Demande de suppression du compte commerçant
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
                    Conformément à la protection des données personnelles, vous pouvez soumettre une demande de résiliation et de suppression complète de votre boutique MarketNet.
                  </p>
                </div>
              </div>
            </div>

            {/* CAS 1 : Demande en attente (pending) */}
            {activeDeletionRequest && activeDeletionRequest.status === "pending" && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                        Demande de clôture de compte en cours d'examen
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        En attente
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Votre demande a été enregistrée le{" "}
                      <strong className="text-foreground">
                        {new Date(activeDeletionRequest.requested_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </strong>.
                      Elle est en attente d'approbation par notre équipe d'administration. Une fois validée, un délai de réflexion de 30 jours commence avant la purge irréversible de vos données.
                    </p>
                  </div>
                </div>

                {/* Détails de la demande */}
                <div className="bg-card border border-border/80 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-semibold">Motif renseigné :</span>
                    <strong className="text-foreground font-bold">
                      {getReasonLabel((activeDeletionRequest as any).reason)}
                    </strong>
                  </div>
                  {(activeDeletionRequest as any).reason_other && (
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-muted-foreground font-semibold shrink-0">Précision :</span>
                      <span className="text-foreground text-right">{(activeDeletionRequest as any).reason_other}</span>
                    </div>
                  )}
                  {(activeDeletionRequest as any).comment && (
                    <div className="pt-2 border-t border-border/60 space-y-1">
                      <span className="text-muted-foreground font-semibold block">Votre commentaire :</span>
                      <p className="italic text-foreground/80 bg-muted/40 p-2.5 rounded-lg text-xs leading-relaxed">
                        "{(activeDeletionRequest as any).comment}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Action d'annulation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-muted-foreground">
                    Vous souhaitez poursuivre vos ventes sur MarketNet ? Vous pouvez annuler votre demande d'un simple clic.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleCancelDeletion}
                    disabled={cancellingDeletion}
                    className="h-10 px-5 rounded-xl font-bold text-xs gap-2 shrink-0 border-border hover:bg-muted"
                  >
                    {cancellingDeletion ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )}
                    <span>Annuler ma demande</span>
                  </Button>
                </div>
              </div>
            )}

            {/* CAS 2 : Demande traitée et programmée (processed) */}
            {activeDeletionRequest && activeDeletionRequest.status === "processed" && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/20 text-destructive shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-sm sm:text-base text-destructive">
                        Compte suspendu — Suppression définitive programmée
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-destructive/20 text-destructive border border-destructive/30">
                        Programmé
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Votre demande a été traitée par un administrateur. Votre boutique est désormais suspendue et l'effacement définitif de toutes vos données interviendra le{" "}
                      <strong className="text-foreground">
                        {activeDeletionRequest.scheduled_deletion_at
                          ? new Date(activeDeletionRequest.scheduled_deletion_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "à la fin de la période de grâce de 30 jours"}
                      </strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-destructive/20">
                  <Link
                    to="/dashboard/support"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <span>Contacter le support pour toute demande de restauration</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* CAS 3 : Aucune demande active en cours */}
            {!activeDeletionRequest && (
              <div className="space-y-6">
                {/* Avertissement clair */}
                <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-4 sm:p-5 flex items-start gap-3.5">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
                    <p className="font-bold text-foreground">
                      Conséquences de la demande de suppression :
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Votre vitrine publique et son catalogue de produits seront définitivement fermés.</li>
                      <li>Toutes vos images, liens de produits et promotions seront irrémédiablement effacés.</li>
                      <li>
                        Une période de sécurité de <strong>30 jours</strong> vous est accordée avant la purge totale afin d'éviter toute perte accidentelle.
                      </li>
                      <li>Votre abonnement en cours sera annulé sans reconduction tacite.</li>
                    </ul>
                  </div>
                </div>

                {!showDeletionForm ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border/80 bg-muted/20">
                    <div>
                      <h3 className="font-bold text-sm text-foreground">
                        Souhaitez-vous fermer votre boutique ?
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Cliquez ci-dessous pour remplir le formulaire officiel de demande de suppression.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeletionForm(true)}
                      className="h-10 px-5 rounded-xl text-xs font-bold gap-2 shrink-0 shadow-xs"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Faire une demande de suppression</span>
                    </Button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleRequestDeletion}
                    className="space-y-5 rounded-2xl border border-destructive/25 bg-card p-5 sm:p-6 shadow-xs animate-in fade-in duration-200"
                  >
                    <div className="border-b border-border/60 pb-3">
                      <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                        <Trash2 className="h-4 w-4 text-destructive" />
                        Formulaire de demande de suppression
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Merci de nous indiquer la raison de votre départ afin de nous aider à nous améliorer.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Motif principal */}
                      <div className="space-y-1.5">
                        <Label htmlFor="deletion-reason" className="text-xs font-bold text-foreground">
                          Motif principal de départ <span className="text-destructive">*</span>
                        </Label>
                        <select
                          id="deletion-reason"
                          value={deletionReason}
                          onChange={(e) => setDeletionReason(e.target.value)}
                          disabled={submittingDeletion}
                          className="w-full rounded-xl border border-border bg-card px-3.5 h-11 text-xs focus:outline-none focus:ring-2 focus:ring-destructive/20 font-medium"
                        >
                          {DELETION_REASONS.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Motif autre si sélectionné */}
                      {deletionReason === "autre" && (
                        <div className="space-y-1.5">
                          <Label htmlFor="deletion-reason-other" className="text-xs font-bold text-foreground">
                            Précisez votre raison <span className="text-destructive">*</span>
                          </Label>
                          <input
                            id="deletion-reason-other"
                            value={deletionReasonOther}
                            onChange={(e) => setDeletionReasonOther(e.target.value)}
                            placeholder="Ex : Je change d'activité commerciale..."
                            disabled={submittingDeletion}
                            className="w-full rounded-xl border border-border bg-card px-3.5 h-11 text-xs focus:outline-none focus:ring-2 focus:ring-destructive/20 font-medium"
                          />
                        </div>
                      )}

                      {/* Commentaire optionnel */}
                      <div className="space-y-1.5">
                        <Label htmlFor="deletion-comment" className="text-xs font-bold text-foreground">
                          Commentaire libre ou suggestions (optionnel)
                        </Label>
                        <textarea
                          id="deletion-comment"
                          value={deletionComment}
                          onChange={(e) => setDeletionComment(e.target.value)}
                          placeholder="Dites-nous ce que nous pourrions faire pour rendre MarketNet encore meilleur..."
                          rows={3}
                          disabled={submittingDeletion}
                          className="w-full rounded-xl border border-border bg-card p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-destructive/20 font-medium"
                        />
                      </div>

                      {/* Case de confirmation explicite */}
                      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-destructive/[0.04] border border-destructive/20">
                        <input
                          id="confirm-risk"
                          type="checkbox"
                          checked={confirmedRisk}
                          onChange={(e) => setConfirmedRisk(e.target.checked)}
                          disabled={submittingDeletion}
                          className="mt-0.5 h-4 w-4 rounded border-border text-destructive focus:ring-destructive/20 cursor-pointer"
                        />
                        <label htmlFor="confirm-risk" className="text-xs text-foreground font-medium leading-relaxed cursor-pointer select-none">
                          Je comprends et confirme que la soumission de cette demande entraînera la clôture de ma vitrine et la suppression irréversible de l'ensemble de mes données après le délai de 30 jours.
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setShowDeletionForm(false);
                          setConfirmedRisk(false);
                        }}
                        disabled={submittingDeletion}
                        className="h-10 px-4 rounded-xl text-xs font-semibold"
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={submittingDeletion || !confirmedRisk}
                        className="h-10 px-5 rounded-xl text-xs font-bold gap-2 shadow-xs"
                      >
                        {submittingDeletion ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span>Confirmer et soumettre la demande</span>
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </section>

          {/* Section d'information & Foire aux questions */}
          <section className="rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-foreground font-extrabold text-sm">
              <HelpCircle className="h-4 w-4 text-primary" />
              <span>Questions fréquentes sur la suppression de compte</span>
            </div>

            <div className="grid sm:grid-cols-3 gap-3.5 pt-1">
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-1.5">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" /> Délai de réflexion
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Un délai de 30 jours s'applique avant la purge complète, vous laissant le temps d'exporter vos informations ou de changer d'avis.
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-1.5">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Annulation facile
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Tant que la demande est en attente, vous pouvez l'annuler d'un clic depuis cet onglet pour reprendre vos ventes normalement.
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-1.5">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-primary" /> Factures & Reçus
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Conformément aux obligations légales et comptables, les reçus de paiement antérieurs sont archivés de façon sécurisée.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
