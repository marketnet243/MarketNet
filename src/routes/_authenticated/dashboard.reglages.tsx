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
  AlertTriangle,
  Loader2,
  Clock,
  ArrowRight,
  Info,
  Package,
  Camera,
  Tag,
  Sparkles,
  Shield,
  Store,
  Mail,
  ExternalLink,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/reglages")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Paramètres du compte — MarketNet" },
      { property: "og:description", content: "Paramètres de votre profil commerçant, sécurité et abonnement." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Paramètres du compte — MarketNet" },
      { name: "description", content: "Paramètres de votre profil commerçant, sécurité et abonnement." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: shop } = useMyShop();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // Demande de suppression
  const [showDeletionForm, setShowDeletionForm] = useState(false);
  const [deletionReason, setDeletionReason] = useState<string>("plus_besoin");
  const [deletionReasonOther, setDeletionReasonOther] = useState("");
  const [deletionComment, setDeletionComment] = useState("");
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

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  async function handleRequestDeletion(e: React.FormEvent) {
    e.preventDefault();
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
      toast.success("Votre demande a été soumise. Vous recevrez un e-mail de confirmation.");
      setShowDeletionForm(false);
      setDeletionComment("");
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
      toast.success("Votre demande de suppression a été annulée.");
      refetchDeletionRequest();
    } catch (err: any) {
      toast.error(err?.message || "Impossible d'annuler la demande.");
    } finally {
      setCancellingDeletion(false);
    }
  }

  async function updateProfile() {
    if (!fullName.trim()) return toast.error("Le nom complet est requis");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() },
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profil mis à jour avec succès");
    qc.invalidateQueries({ queryKey: ["auth-user"] });
  }

  const currentPlanId = subLimits?.plan_id || shop?.plan_id || "free";
  const isGrace = subLimits?.is_grace_period;
  const isExpired = subLimits?.status === "expiré";

  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8 pb-16">
      {/* ── En-tête de la page ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-normal text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
              Espace Commerçant
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-normal text-foreground">
            Réglages &amp; Compte
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Gérez votre identité, votre formule d'abonnement et la sécurité de votre compte.
          </p>
        </div>

        {shop?.slug && (
          <Link
            to="/b/$slug"
            params={{ slug: shop.slug }}
            target="_blank"
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border bg-card hover:bg-muted/50 px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-xs"
          >
            <Store className="h-3.5 w-3.5 text-primary" />
            <span>Voir ma boutique</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </Link>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          1. PROFIL & IDENTITÉ
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="rounded-3xl border bg-card shadow-sm overflow-hidden">
        {/* En-tête de la carte profil */}
        <div className="p-5 sm:p-6 border-b bg-muted/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 text-primary font-black text-xl shrink-0 border border-primary/20 shadow-xs">
              {(fullName || shop?.name || "M").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-foreground">
                  {fullName || "Commerçant MarketNet"}
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-success/10 text-success dark:text-success border border-success/20 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Vérifié
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Boutique associée : <strong className="text-foreground">{shop?.name || "Ma boutique"}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Corps des champs */}
        <div className="p-5 sm:p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            {/* Nom complet */}
            <div className="space-y-1.5">
              <Label htmlFor="fullname" className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Nom complet
              </Label>
              <Input
                id="fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Landry Kayoyo"
                className="h-10 rounded-xl bg-background border-border focus-visible:ring-primary"
              />
            </div>

            {/* Email de connexion */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="email" className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Adresse e-mail
                </Label>
                <span className="text-[10px] text-muted-foreground font-medium">Lecture seule</span>
              </div>
              <Input
                id="email"
                value={email}
                disabled
                className="h-10 bg-muted/50 text-muted-foreground cursor-not-allowed rounded-xl border-dashed"
              />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            L'adresse e-mail correspond à vos identifiants Supabase sécurisés. Pour toute modification d'adresse, contactez l'assistance.
          </p>

          <div className="flex justify-end pt-2 border-t">
            <Button
              onClick={updateProfile}
              disabled={saving}
              className="w-full sm:w-auto rounded-xl h-10 font-bold px-6 shadow-xs"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enregistrement…
                </>
              ) : (
                "Enregistrer les modifications"
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          2. ABONNEMENT & FORMULE
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="rounded-3xl border bg-card shadow-sm overflow-hidden space-y-0">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/15">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-foreground">
                Abonnement &amp; Limites
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Statut de votre formule active et quotas actuels de votre catalogue.
              </p>
            </div>
          </div>

          <span
            className={cn(
              "self-start sm:self-auto rounded-full px-3 py-1 text-xs font-bold border",
              isGrace
                ? "bg-warning/15 text-warning dark:text-warning border-warning/30"
                : isExpired
                ? "bg-destructive/15 text-destructive dark:text-destructive border-destructive/30"
                : "bg-primary/15 text-primary border-primary/25"
            )}
          >
            {isGrace ? "Période de grâce" : isExpired ? "Expiré" : "Formule active"}
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Alertes d'expiration */}
          {subLimits?.reminder_level === "7_days" && (
            <div className="flex items-center gap-3 rounded-2xl bg-warning/10 border border-warning/25 p-3.5 text-warning dark:text-warning text-xs">
              <Clock className="h-4 w-4 shrink-0 text-warning" />
              <p>
                Votre formule expire dans <strong>{subLimits.days_remaining} jour(s)</strong>.
                Pensez à renouveler dès maintenant pour éviter l'interruption des fonctionnalités.
              </p>
            </div>
          )}
          {subLimits?.reminder_level === "3_days" && (
            <div className="flex items-center gap-3 rounded-2xl bg-destructive/10 border border-destructive/25 p-3.5 text-destructive dark:text-destructive text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0 text-destructive animate-bounce" />
              <p className="font-bold">
                Attention : votre formule expire dans {subLimits.days_remaining} jour(s).
              </p>
            </div>
          )}
          {isGrace && (
            <div className="flex items-center gap-3 rounded-2xl bg-warning/15 border border-warning/30 p-3.5 text-warning dark:text-warning text-xs">
              <Clock className="h-4 w-4 shrink-0 text-warning animate-pulse" />
              <p className="font-bold">
                Période de grâce de 7 jours active. Renouvelez votre plan sans tarder.
              </p>
            </div>
          )}

          {/* Disposition en 2 blocs équilibrés */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Bloc gauche : Nom du plan et date */}
            <div className="rounded-2xl border bg-muted/20 p-4 sm:p-5 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-normal text-muted-foreground">
                  Formule souscrite
                </span>
                <p className="text-2xl font-black text-foreground capitalize mt-1">
                  Plan {subLimits?.plan_name || shop?.plan_id || "Gratuit"}
                </p>
              </div>

              {subLimits?.ends_at && currentPlanId !== "free" ? (
                <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground">
                  <span>Date d'échéance : </span>
                  <strong className="text-foreground">
                    {new Date(subLimits.ends_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                  Formule permanente sans engagement
                </p>
              )}
            </div>

            {/* Bloc droit : Quotas clés */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border bg-muted/20 p-3.5 flex flex-col justify-center space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-primary" /> Produits
                </span>
                <p className="text-base sm:text-lg font-black text-foreground">
                  {subLimits?.max_products != null ? `${subLimits.max_products} max` : "Illimité"}
                </p>
              </div>

              <div className="rounded-2xl border bg-muted/20 p-3.5 flex flex-col justify-center space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-primary" /> Photos / prod.
                </span>
                <p className="text-base sm:text-lg font-black text-foreground">
                  {subLimits?.max_photos ?? 3} photos
                </p>
              </div>

              <div className="rounded-2xl border bg-muted/20 p-3.5 flex flex-col justify-center space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-primary" /> Promotions
                </span>
                <p className="text-base sm:text-lg font-black text-foreground">
                  {subLimits?.max_active_promotions != null
                    ? `${subLimits.max_active_promotions} max`
                    : "Illimitées"}
                </p>
              </div>

              <div className="rounded-2xl border bg-muted/20 p-3.5 flex flex-col justify-center space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Fonctions
                </span>
                <p className="text-base sm:text-lg font-black text-foreground">
                  {subLimits?.advanced_stats ? "Pro & Stats" : "Standard"}
                </p>
              </div>
            </div>
          </div>

          {/* Lien d'action direct vers la page complète des formules */}
          <Link
            to="/dashboard/abonnement"
            className="flex items-center justify-between w-full rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent hover:from-primary/15 hover:via-primary/10 border border-primary/25 p-4 text-xs sm:text-sm font-bold text-primary transition-all group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="text-left">
                <span className="text-foreground font-extrabold block">
                  Changer de formule, renouveler ou voir les tarifs
                </span>
                <span className="text-muted-foreground text-xs font-normal">
                  Consultez la grille des plans et gérez vos factures et reçus
                </span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 shrink-0 ml-3" />
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. SÉCURITÉ & SESSION
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="rounded-3xl border bg-card p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/10 text-foreground dark:text-foreground shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-foreground">Sécurité de la session</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Connecté en tant que <strong className="text-foreground">{email}</strong>. Déconnectez votre session en toute sécurité.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => supabase.auth.signOut().then(() => (window.location.href = "/auth"))}
          className="w-full sm:w-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl justify-center h-10 font-bold shrink-0"
        >
          <LogOut className="h-4 w-4 mr-2" /> Déconnexion
        </Button>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. ZONE DE DANGER (Demande de suppression de compte)
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="rounded-3xl border border-destructive dark:border-destructive bg-destructive/[0.02] p-5 sm:p-6 shadow-sm space-y-4">
        {/* Demande en cours */}
        {activeDeletionRequest && activeDeletionRequest.status === "pending" && (
          <div className="flex items-start gap-3 rounded-2xl bg-warning/10 border border-warning/30 p-4">
            <Clock className="h-5 w-5 shrink-0 text-warning mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-warning dark:text-warning">
                Demande de suppression en cours d'examen
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Votre demande soumise le{" "}
                <strong>
                  {new Date(activeDeletionRequest.requested_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </strong>{" "}
                est en attente de traitement par l'administration.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelDeletion}
              disabled={cancellingDeletion}
              className="shrink-0 text-warning hover:text-warning hover:bg-warning/20 text-xs font-bold rounded-xl"
            >
              {cancellingDeletion ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Annuler la demande"
              )}
            </Button>
          </div>
        )}

        {/* Compte suspendu / suppression programmée */}
        {activeDeletionRequest && activeDeletionRequest.status === "processed" && (
          <div className="flex items-start gap-3 rounded-2xl bg-destructive/10 border border-destructive/30 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-destructive dark:text-destructive">
                Compte suspendu — suppression programmée
              </p>
              {activeDeletionRequest.scheduled_deletion_at && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Suppression définitive prévue le{" "}
                  <strong>
                    {new Date(activeDeletionRequest.scheduled_deletion_at).toLocaleDateString(
                      "fr-FR",
                      { day: "numeric", month: "long", year: "numeric" }
                    )}
                  </strong>
                  . Pour toute restauration de votre compte ou de votre boutique, contactez le support avant cette date.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Formulaire & Déclencheur */}
        {!activeDeletionRequest && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm sm:text-base text-destructive dark:text-destructive">
                  Demander la suppression du compte
                </h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Votre demande est examinée par notre équipe avec un délai de grâce pouvant aller jusqu'à 30 jours pour restaurer vos données.
                </p>
              </div>
            </div>

            {!showDeletionForm && (
              <Button
                variant="outline"
                onClick={() => setShowDeletionForm(true)}
                className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive dark:border-destructive rounded-xl shrink-0 h-10 font-bold"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Faire une demande
              </Button>
            )}
          </div>
        )}

        {/* Formulaire de suppression ouvert */}
        {showDeletionForm && !activeDeletionRequest && (
          <form
            onSubmit={handleRequestDeletion}
            className="space-y-4 rounded-2xl border border-destructive/80 dark:border-destructive/50 bg-background p-4 sm:p-5 mt-2 shadow-xs"
          >
            <div className="space-y-1.5">
              <Label htmlFor="deletion-reason" className="text-xs font-bold text-foreground">
                Motif principal de votre départ
              </Label>
              <select
                id="deletion-reason"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                disabled={submittingDeletion}
                className="w-full rounded-xl border border-input bg-background px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {DELETION_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {deletionReason === "autre" && (
              <div className="space-y-1.5">
                <Label htmlFor="deletion-reason-other" className="text-xs font-bold text-foreground">
                  Préciser la raison
                </Label>
                <Input
                  id="deletion-reason-other"
                  value={deletionReasonOther}
                  onChange={(e) => setDeletionReasonOther(e.target.value)}
                  placeholder="Précisez la raison de votre départ"
                  disabled={submittingDeletion}
                  className="rounded-xl h-10"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="deletion-comment" className="text-xs font-bold text-foreground">
                Commentaire libre (optionnel)
              </Label>
              <textarea
                id="deletion-comment"
                value={deletionComment}
                onChange={(e) => setDeletionComment(e.target.value)}
                placeholder="Partagez vos remarques ou suggestions avec notre équipe..."
                disabled={submittingDeletion}
                rows={3}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div className="flex items-start gap-2.5 rounded-xl bg-warning/10 border border-warning/20 p-3.5">
              <Info className="h-4 w-4 shrink-0 text-warning mt-0.5" />
              <p className="text-xs text-warning dark:text-warning leading-relaxed">
                Après validation par notre équipe, votre boutique sera suspendue. Vous disposerez
                d'un délai de grâce (jusqu'à 30 jours) pour contacter le support et annuler la suppression si vous changez d'avis.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeletionForm(false)}
                disabled={submittingDeletion}
                className="w-full sm:w-auto rounded-xl h-10"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={
                  submittingDeletion ||
                  (deletionReason === "autre" && !deletionReasonOther.trim())
                }
                className="w-full sm:w-auto bg-destructive hover:bg-destructive text-primary-foreground rounded-xl font-bold h-10 shadow-xs"
              >
                {submittingDeletion ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Envoi en cours…
                  </>
                ) : (
                  "Soumettre la demande"
                )}
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
