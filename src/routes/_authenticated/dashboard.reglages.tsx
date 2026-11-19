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
    <div className="mx-auto max-w-4xl space-y-5 pb-16">
      {/* ── En-tête de la page ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Réglages &amp; Compte</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gérez votre profil commerçant, votre formule d'abonnement et la sécurité de votre compte.
          </p>
        </div>

        {shop?.slug && (
          <Link
            to="/b/$slug"
            params={{ slug: shop.slug }}
            target="_blank"
            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          >
            <Store className="h-3.5 w-3.5 text-slate-500" />
            <span>Voir ma vitrine</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </Link>
        )}
      </div>

      {/* ── 1. PROFIL & IDENTITÉ ── */}
      <section className="rounded-3xl border border-slate-200/70 bg-white shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4F46E5] text-white font-extrabold text-lg shrink-0 shadow-xs">
              {(fullName || shop?.name || "M").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-slate-900">
                  {fullName || "Commerçant MarketNet"}
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Vérifié
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Boutique : <strong className="text-slate-700">{shop?.name || "Ma boutique"}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Nom complet */}
            <div className="space-y-1.5">
              <Label htmlFor="fullname" className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" />
                Nom complet
              </Label>
              <input
                id="fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Landry Kayoyo"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]/40"
              />
            </div>

            {/* Email de connexion */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  Adresse e-mail
                </Label>
                <span className="text-[10px] text-slate-400 font-medium">Lecture seule</span>
              </div>
              <input
                id="email"
                value={email}
                disabled
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed px-3.5 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={updateProfile}
              disabled={saving}
              className="flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-[#4F46E5] text-white font-bold text-xs hover:bg-[#4338CA] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Enregistrer les modifications
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. ABONNEMENT & LIMITES ── */}
      <section className="rounded-3xl border border-slate-200/70 bg-white shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F46E5] shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900">Abonnement &amp; Limites</h2>
              <p className="text-xs text-slate-400 mt-0.5">Statut de votre formule active et quotas actuels.</p>
            </div>
          </div>

          <span
            className={cn(
              "self-start sm:self-auto rounded-full px-3 py-1 text-xs font-bold border",
              isGrace
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : isExpired
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-[#EEF2FF] text-[#4F46E5] border-[#E0E7FF]"
            )}
          >
            {isGrace ? "Période de grâce" : isExpired ? "Expiré" : "Formule active"}
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* Disposition en 2 blocs */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 sm:p-5 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Formule souscrite</span>
                <p className="text-2xl font-black text-slate-900 capitalize mt-1">
                  Plan {subLimits?.plan_name || shop?.plan_id || "Gratuit"}
                </p>
              </div>

              {subLimits?.ends_at && currentPlanId !== "free" ? (
                <div className="pt-2 border-t border-slate-200 text-xs text-slate-500">
                  <span>Échéance : </span>
                  <strong className="text-slate-800">
                    {new Date(subLimits.ends_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                </div>
              ) : (
                <p className="text-xs text-slate-400 pt-2 border-t border-slate-200">
                  Formule permanente sans engagement
                </p>
              )}
            </div>

            {/* Quotas clés */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3 flex flex-col justify-center">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Package className="h-3 w-3 text-slate-500" /> Produits
                </span>
                <p className="text-base font-extrabold text-slate-900 mt-1">
                  {subLimits?.max_products != null ? `${subLimits.max_products} max` : "Illimité"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3 flex flex-col justify-center">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Camera className="h-3 w-3 text-slate-500" /> Photos / prod.
                </span>
                <p className="text-base font-extrabold text-slate-900 mt-1">
                  {subLimits?.max_photos ?? 3} photos
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3 flex flex-col justify-center">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Tag className="h-3 w-3 text-slate-500" /> Promotions
                </span>
                <p className="text-base font-extrabold text-slate-900 mt-1">
                  {subLimits?.max_active_promotions != null ? `${subLimits.max_active_promotions} max` : "Illimitées"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-3 flex flex-col justify-center">
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-slate-500" /> Fonctions
                </span>
                <p className="text-base font-extrabold text-slate-900 mt-1">
                  {subLimits?.advanced_stats ? "Pro & Stats" : "Standard"}
                </p>
              </div>
            </div>
          </div>

          {/* Lien vers abonnement */}
          <Link
            to="/dashboard/abonnement"
            className="flex items-center justify-between w-full rounded-2xl bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#E0E7FF] p-4 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4F46E5] text-white shadow-xs shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <span className="text-slate-900 font-extrabold text-xs sm:text-sm block">
                  Changer de formule, renouveler ou voir les tarifs
                </span>
                <span className="text-slate-500 text-[11px]">
                  Consultez la grille des plans et gérez vos factures
                </span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#4F46E5] transition-transform group-hover:translate-x-1 shrink-0 ml-3" />
          </Link>
        </div>
      </section>

      {/* ── 3. SÉCURITÉ & SESSION ── */}
      <section className="rounded-3xl border border-slate-200/70 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-slate-900">Sécurité de la session</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Connecté avec <strong className="text-slate-700">{email}</strong>. Déconnectez votre session en toute sécurité.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => supabase.auth.signOut().then(() => (window.location.href = "/auth"))}
          className="flex items-center justify-center gap-2 h-10 px-5 rounded-full border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="h-4 w-4" />
          <span>Se déconnecter</span>
        </button>
      </section>

      {/* ── 4. SUPPRESSION DU COMPTE ── */}
      <section className="rounded-3xl border border-slate-200/70 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        {/* Demande en cours */}
        {activeDeletionRequest && activeDeletionRequest.status === "pending" && (
          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4">
            <Clock className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-amber-900">
                Demande de suppression en cours d'examen
              </p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
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
            <button
              type="button"
              onClick={handleCancelDeletion}
              disabled={cancellingDeletion}
              className="shrink-0 text-amber-800 hover:bg-amber-100 px-3 py-1.5 text-xs font-bold rounded-full border border-amber-300 transition-colors cursor-pointer"
            >
              {cancellingDeletion ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Annuler la demande"}
            </button>
          </div>
        )}

        {!activeDeletionRequest && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-sm sm:text-base text-rose-600">
                  Suppression du compte
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Votre demande est examinée avec un délai de grâce de 30 jours pour restaurer vos données.
                </p>
              </div>
            </div>

            {!showDeletionForm && (
              <button
                type="button"
                onClick={() => setShowDeletionForm(true)}
                className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-full border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-600 text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Faire une demande</span>
              </button>
            )}
          </div>
        )}

        {/* Formulaire ouvert */}
        {showDeletionForm && !activeDeletionRequest && (
          <form onSubmit={handleRequestDeletion} className="space-y-4 rounded-2xl border border-rose-200 bg-rose-50/30 p-4 sm:p-5 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="deletion-reason" className="text-xs font-bold text-slate-700">
                Motif principal de votre départ
              </Label>
              <select
                id="deletion-reason"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                disabled={submittingDeletion}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 h-11 text-xs focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
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
                <Label htmlFor="deletion-reason-other" className="text-xs font-bold text-slate-700">
                  Préciser la raison
                </Label>
                <input
                  id="deletion-reason-other"
                  value={deletionReasonOther}
                  onChange={(e) => setDeletionReasonOther(e.target.value)}
                  placeholder="Précisez la raison"
                  disabled={submittingDeletion}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 h-11 text-xs focus:outline-none"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="deletion-comment" className="text-xs font-bold text-slate-700">
                Commentaire libre (optionnel)
              </Label>
              <textarea
                id="deletion-comment"
                value={deletionComment}
                onChange={(e) => setDeletionComment(e.target.value)}
                placeholder="Partagez vos remarques ou suggestions avec notre équipe…"
                disabled={submittingDeletion}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs focus:outline-none resize-none"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeletionForm(false)}
                disabled={submittingDeletion}
                className="h-10 px-4 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submittingDeletion || (deletionReason === "autre" && !deletionReasonOther.trim())}
                className="flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs"
              >
                {submittingDeletion ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Soumettre la demande
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
