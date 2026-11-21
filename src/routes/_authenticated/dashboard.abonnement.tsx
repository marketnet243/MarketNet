import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Star,
  CheckCircle2,
  Shield,
  Receipt,
  Clock,
  ArrowRight,
  Loader2,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Package,
  Camera,
  Tag,
  Share2,
  MessageCircle,
  BarChart3,
  Palette,
  ChevronLeft,
  ChevronRight,
  XCircle,
  ExternalLink,
  Eye,
  RefreshCw,
  FileDown,
  Mail,
  Check,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useMyShop } from "@/hooks/useMyShop";
import {
  getMerchantSubscription,
  getMerchantPayments,
  getPlanPrices,
  createCheckoutSession,
} from "@/lib/subscriptions.functions";
import { formatCDF, formatUSD, type SubscriptionPeriod, type PlanPrice } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/imported-database";

/** Génère dynamiquement la liste des features d'un plan depuis ses colonnes DB */
function buildPlanFeatures(p: {
  max_products: number | null;
  max_photos: number | null;
  max_active_promotions: number | null;
  advanced_themes: boolean;
  advanced_stats: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): { text: string; icon: ComponentType<any>; strong?: boolean }[] {
  const features: { text: string; icon: ComponentType<any>; strong?: boolean }[] = [];

  // Produits
  features.push({
    icon: Package,
    strong: true,
    text: p.max_products != null
      ? `Jusqu'à ${p.max_products} produits`
      : "Produits illimités",
  });

  // Photos
  features.push({
    icon: Camera,
    text: `${p.max_photos ?? 3} photos par produit`,
  });

  // WhatsApp (toujours inclus)
  features.push({
    icon: MessageCircle,
    text: "Commandes directes WhatsApp",
  });

  // Promotions
  if (p.max_active_promotions === 0) {
    features.push({ icon: Tag, text: "0 promotion incluse" });
  } else if (p.max_active_promotions != null) {
    features.push({ icon: Tag, text: `${p.max_active_promotions} promotion(s) active(s)` });
  } else {
    features.push({ icon: Tag, text: "Promotions actives illimitées" });
  }

  // Partage & visibilité
  features.push({ icon: Share2, text: "Partage en un clic & affiches prêtes à publier" });

  // Thèmes premium
  if (p.advanced_themes) {
    features.push({ icon: Palette, text: "Templates & thèmes premium" });
  }

  // Statistiques avancées
  if (p.advanced_stats) {
    features.push({ icon: BarChart3, text: "Statistiques de ventes avancées" });
  }

  return features;
}

/** Squelette de chargement d'une carte plan */
function PlanCardSkeleton() {
  return (
    <div className="rounded-3xl border bg-card p-5 sm:p-6 space-y-4 animate-pulse">
      <div className="h-5 w-24 rounded-full bg-muted" />
      <div className="h-8 w-32 rounded-lg bg-muted" />
      <div className="h-3 w-full rounded bg-muted" />
      <div className="space-y-2 pt-2 border-t">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-3 rounded bg-muted" style={{ width: `${60 + i * 10}%` }} />
        ))}
      </div>
      <div className="h-10 rounded-xl bg-muted" />
    </div>
  );
}

function SubscriptionErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  return (
    <div className="mx-auto max-w-4xl p-6 my-8 rounded-3xl border bg-card text-center space-y-4">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-xl font-bold">Impossible de charger la page d'abonnement</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Une erreur de chargement est survenue. Veuillez vérifier votre session ou rafraîchir."}
        </p>
      </div>
      <div className="flex justify-center gap-3">
        <Button onClick={() => reset()} variant="default" className="rounded-xl">
          <RefreshCw className="mr-2 h-4 w-4" /> Réessayer
        </Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/dashboard/abonnement")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Mon Abonnement & Paiements — MarketNet" },
      { property: "og:description", content: "Gérez votre formule d'abonnement MarketNet et payez en Dollars ($ USD) via SasPay." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Mon Abonnement & Paiements — MarketNet" },
      { name: "description", content: "Gérez votre formule d'abonnement MarketNet et payez en Dollars ($ USD) via SasPay." },
    ],
  }),
  errorComponent: SubscriptionErrorComponent,
  component: DashboardAbonnementPage,
});

const ITEMS_PER_PAGE = 5;

type HistoryFilter = "all" | "payé" | "attribué" | "en_attente" | "échoué";

function isPaymentAttributed(p: any): boolean {
  if (!p) return false;
  const isPaid = p.statut === "payé" || p.status === "approved";
  const isManual =
    p.methode === "manuel" ||
    p.method === "manuel" ||
    p.method === "cash" ||
    p.admin_note?.includes("Attribution");
  return isPaid && isManual;
}

const FALLBACK_PLANS = [
  {
    id: "free",
    name: "Gratuit",
    price_usd: 0,
    price_cdf: 0,
    max_products: 10,
    max_photos: 3,
    max_active_promotions: 1,
    promo_templates: ["fullscreen", "split", "minimal"],
    advanced_themes: true,
    advanced_stats: true,
    active: true,
    position: 0,
  },
  {
    id: "pro",
    name: "Pro",
    price_usd: 3,
    price_cdf: 0,
    max_products: null,
    max_photos: 6,
    max_active_promotions: null,
    promo_templates: ["fullscreen", "split", "badge", "minimal", "countdown"],
    advanced_themes: true,
    advanced_stats: true,
    active: true,
    position: 1,
  },
];

const FALLBACK_PRICES: PlanPrice[] = [
  { id: "free-m", plan_id: "free", period: "mensuel", price_usd: 0, price_cdf: 0, currency: "USD", is_active: true, created_at: "", updated_at: "" },
  { id: "free-a", plan_id: "free", period: "annuel", price_usd: 0, price_cdf: 0, currency: "USD", is_active: true, created_at: "", updated_at: "" },
  { id: "pro-m", plan_id: "pro", period: "mensuel", price_usd: 3, price_cdf: 0, currency: "USD", is_active: true, created_at: "", updated_at: "" },
  { id: "pro-a", plan_id: "pro", period: "annuel", price_usd: 30, price_cdf: 0, currency: "USD", is_active: true, created_at: "", updated_at: "" },
];

function DashboardAbonnementPage() {
  const { data: shop } = useMyShop();
  const navigate = useNavigate();

  const [selectedPeriod, setSelectedPeriod] = useState<SubscriptionPeriod>("mensuel");
  const [payingPlanId, setPayingPlanId] = useState<string | null>(null);

  // Pagination et filtres de l'historique
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const handleCopyRef = (refText: string) => {
    navigator.clipboard.writeText(refText);
    setCopiedRef(true);
    toast.success("Référence copiée dans le presse-papier");
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const getLimitsFn = useServerFn(getMerchantSubscription);
  const getPaymentsFn = useServerFn(getMerchantPayments);
  const getPricesFn = useServerFn(getPlanPrices);
  const createCheckoutFn = useServerFn(createCheckoutSession);

  // Données de l'abonnement
  const { data: subLimits, isLoading: limitsLoading, refetch: refetchLimits } = useQuery({
    queryKey: ["subscription-limits", shop?.id],
    enabled: !!shop?.id,
    queryFn: () => getLimitsFn({ data: { shopId: shop!.id } }),
  });

  // Historique des paiements
  const { data: paymentHistory, isLoading: paymentsLoading, refetch: refetchPayments, isFetching: paymentsFetching } = useQuery({
    queryKey: ["merchant-payments", shop?.id],
    enabled: !!shop?.id,
    queryFn: () => getPaymentsFn({ data: { shopId: shop!.id } }),
  });

  // Tarifs depuis la base de données (avec fallback immédiat 3$ / 30$)
  const { data: planPrices, isLoading: pricesLoading } = useQuery({
    queryKey: ["plan-prices"],
    queryFn: () => getPricesFn(),
    placeholderData: FALLBACK_PRICES,
  });

  // Plans actifs depuis la base de données (avec fallback immédiat pour 0 CLS)
  const { data: dbPlans, isLoading: plansLoading } = useQuery({
    queryKey: ["plans-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("active", true)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data && data.length > 0) ? data : FALLBACK_PLANS;
    },
    placeholderData: FALLBACK_PLANS,
    staleTime: 5 * 60 * 1000,
  });

  // Lancement du paiement SasPay
  async function handlePay(planId: string) {
    if (!shop?.id) return;
    setPayingPlanId(planId);
    try {
      const res = await createCheckoutFn({
        data: {
          shopId: shop.id,
          planId,
          period: selectedPeriod,
        },
      });

      if (res?.checkoutUrl) {
        if (res.reused) {
          toast.info("Session de paiement en cours réutilisée. Redirection…");
        } else {
          toast.success("Session SasPay créée. Redirection…");
        }
        window.location.href = res.checkoutUrl;
      } else {
        toast.error("Impossible d'obtenir le lien de paiement.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la création du paiement";
      toast.error(msg);
    } finally {
      setPayingPlanId(null);
    }
  }

  const currentPlanId = subLimits?.plan_id || shop?.plan_id || "free";
  const isGrace = subLimits?.is_grace_period;
  const isExpired = subLimits?.status === "expiré";
  const isCurrentPro = currentPlanId === "pro" && !isExpired;

  // Résolution précise et robuste du statut (priorité à l'attribution manuelle par admin)
  function resolvePaymentStatus(pay: any): "payé" | "attribué" | "en_attente" | "échoué" | "annulé" {
    if (isPaymentAttributed(pay)) return "attribué";
    if (pay.statut === "payé" || pay.status === "approved") return "payé";
    if (pay.statut === "échoué" || pay.status === "rejected") return "échoué";
    if (pay.statut === "annulé") return "annulé";
    if (pay.statut === "expiré") return "échoué";
    if (pay.statut === "en_attente" || pay.statut === "à_vérifier") return "en_attente";
    if (!pay.statut && pay.status === "pending") return "en_attente";
    return "échoué";
  }

  // Traitement et pagination de l'historique
  const allHistory = useMemo(() => paymentHistory ?? [], [paymentHistory]);

  const historyCounts = useMemo(() => {
    let paye = 0;
    let attribue = 0;
    let enAttente = 0;
    let echoue = 0;

    for (const p of allHistory) {
      const st = resolvePaymentStatus(p);
      if (st === "attribué") attribue++;
      else if (st === "payé") paye++;
      else if (st === "en_attente") enAttente++;
      else echoue++;
    }

    return {
      all: allHistory.length,
      payé: paye,
      attribué: attribue,
      en_attente: enAttente,
      échoué: echoue,
    };
  }, [allHistory]);

  const filteredHistory = useMemo(() => {
    return allHistory.filter((pay) => {
      if (historyFilter === "all") return true;
      const st = resolvePaymentStatus(pay);
      if (historyFilter === "attribué") return st === "attribué";
      if (historyFilter === "payé") return st === "payé";
      if (historyFilter === "en_attente") return st === "en_attente";
      if (historyFilter === "échoué") return st === "échoué" || st === "annulé";
      return true;
    });
  }, [allHistory, historyFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / ITEMS_PER_PAGE));
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHistory, currentPage]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Formules & Facturation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-normal">Mon Abonnement</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Choisissez la formule adaptée à la croissance de votre boutique. Paiement sécurisé via SasPay.
          </p>
        </div>
      </div>

      {/* ── Alertes de renouvellement et de période de grâce ─────────────── */}
      {subLimits?.reminder_level === "7_days" && !isGrace && (
        <div className="flex items-center gap-3 rounded-2xl bg-warning/10 border border-warning/20 p-4 text-warning dark:text-warning text-xs sm:text-sm">
          <Clock className="h-5 w-5 shrink-0 text-warning" />
          <div className="space-y-0.5">
            <p className="font-bold">Votre formule expire dans {subLimits.days_remaining} jour(s)</p>
            <p className="opacity-90">Renouvelez dès aujourd'hui sans perdre vos jours restants.</p>
          </div>
        </div>
      )}

      {subLimits?.reminder_level === "3_days" && !isGrace && (
        <div className="flex items-center gap-3 rounded-2xl bg-warning/15 border border-warning/30 p-4 text-warning dark:text-warning text-xs sm:text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-warning" />
          <div className="space-y-0.5">
            <p className="font-bold">Expiration imminente : plus que {subLimits.days_remaining} jour(s)</p>
            <p className="opacity-90">Renouvelez maintenant pour éviter l'interruption des fonctionnalités avancées.</p>
          </div>
        </div>
      )}

      {isGrace && (
        <div className="flex items-center gap-3 rounded-2xl bg-warning/15 border border-warning/30 p-4 text-warning dark:text-warning text-xs sm:text-sm">
          <Clock className="h-5 w-5 shrink-0 text-warning animate-pulse" />
          <div className="space-y-0.5">
            <p className="font-bold">Période de grâce de 7 jours active</p>
            <p className="opacity-90">
              Votre abonnement est arrivé à échéance. Vous bénéficiez de 7 jours pour renouveler avant le masquage des produits excédentaires.
            </p>
          </div>
        </div>
      )}

      {isExpired && (
        <div className="flex items-center gap-3 rounded-2xl bg-destructive/15 border border-destructive/30 p-4 text-destructive dark:text-destructive text-xs sm:text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          <div className="space-y-0.5">
            <p className="font-bold">Abonnement expiré — Formule Gratuite appliquée</p>
            <p className="opacity-90">
              Vos produits au-delà de 10 sont temporairement masqués et vos promotions mises en pause. Souscrivez à nouveau pour tout débloquer.
            </p>
          </div>
        </div>
      )}

            {/* ── Statut compact & discret de la boutique (Remplace l'ancienne section lourde) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-card/60 backdrop-blur-xs text-xs">
        <div className="flex items-center gap-2.5">
          <span className={cn(
            "h-2.5 w-2.5 rounded-full shrink-0",
            currentPlanId === "pro" && !isExpired && !isGrace ? "bg-emerald-500 shadow-xs shadow-emerald-500/50" :
            isGrace ? "bg-amber-500 animate-pulse" :
            isExpired ? "bg-destructive" :
            "bg-muted-foreground/40"
          )} />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground">Formule active :</span>
            <span className="font-bold text-foreground">
              Plan {subLimits?.plan_name || (currentPlanId === "pro" ? "Pro" : "Gratuit")}
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold border",
              isGrace ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" :
              isExpired ? "bg-destructive/10 text-destructive border-destructive/20" :
              currentPlanId === "pro" ? "bg-primary/10 text-primary border-primary/20" :
              "bg-muted text-muted-foreground border-border"
            )}>
              {isGrace ? "Période de grâce" : isExpired ? "Expiré" : currentPlanId === "pro" ? "Actif" : "Gratuit (10 produits max)"}
            </span>
          </div>
        </div>

        {subLimits?.ends_at && currentPlanId !== "free" && (
          <div className="text-muted-foreground text-[11px] sm:text-right">
            Échéance : <strong className="text-foreground">{new Date(subLimits.ends_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</strong>
          </div>
        )}
      </div>

      {/* ── SECTION D'OFFRE PRINCIPALE (INSPIRÉE DU MODÈLE VYTRINI) ── */}
      <section className="rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card to-muted/20 p-5 sm:p-8 shadow-sm space-y-6">
        {/* Titre & Sous-titre inspiré de la maquette */}
        <div className="text-center max-w-lg mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Offre de lancement Pro</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Lance-toi, {shop?.name || "Commerçant"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Active ta vitrine Pro : ton catalogue est prêt à partager et tes clients commandent directement sur WhatsApp avec 0% de commission.
          </p>
        </div>

        {/* ── Sélecteur de Durée Visuel (Mensuel / Annuel Meilleure Valeur) ── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5 max-w-md mx-auto pt-2">
          {/* Option Mensuel */}
          <button
            type="button"
            onClick={() => setSelectedPeriod("mensuel")}
            className={cn(
              "rounded-2xl border p-4 sm:p-5 text-center flex flex-col items-center justify-between transition-all cursor-pointer relative",
              selectedPeriod === "mensuel"
                ? "border-2 border-primary bg-primary/[0.04] shadow-md shadow-primary/10"
                : "border-border/80 bg-card hover:border-muted-foreground/30 hover:bg-muted/10"
            )}
          >
            <span className="text-xs sm:text-sm font-bold text-foreground">Mensuel</span>
            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-black text-foreground">3 $</span>
              <span className="text-[11px] text-muted-foreground block">/ mois</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">Sans engagement</span>
          </button>

          {/* Option Annuel — Meilleure Valeur */}
          <button
            type="button"
            onClick={() => setSelectedPeriod("annuel")}
            className={cn(
              "rounded-2xl border p-4 sm:p-5 text-center flex flex-col items-center justify-between transition-all cursor-pointer relative",
              selectedPeriod === "annuel"
                ? "border-2 border-primary bg-primary/[0.04] shadow-md shadow-primary/10"
                : "border-border/80 bg-card hover:border-muted-foreground/30 hover:bg-muted/10"
            )}
          >
            {/* Badge surélevé "Meilleure valeur" */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs whitespace-nowrap">
              Meilleure valeur
            </div>

            <span className="text-xs sm:text-sm font-bold text-foreground">Annuel</span>
            <div className="my-2">
              <span className="text-xs text-muted-foreground line-through block">36 $</span>
              <span className="text-2xl sm:text-3xl font-black text-primary">30 $</span>
              <span className="text-[11px] text-muted-foreground block">/ an (~2,50 $/mois)</span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Économisez 17%</span>
          </button>
        </div>

        {/* ── Bloc Récapitulatif avec Coches Vertes (comme dans l'image Vytrini) ── */}
        <div className="max-w-lg mx-auto rounded-2xl border border-border/80 bg-muted/20 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <span className="font-extrabold text-xs sm:text-sm text-foreground">
              {selectedPeriod === "mensuel" ? "Formule Pro Mensuelle • 3 $/mois" : "Formule Pro Annuelle • 30 $/an"}
            </span>
            <span className="text-[11px] font-bold text-primary">Tout inclus</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground/90 pt-1">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
              <span>Produits illimités</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
              <span>6 photos HD par produit</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
              <span>Commandes WhatsApp</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
              <span>Promotions illimitées</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
              <span>Thèmes & personnalisation</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
              <span>Statistiques de ventes</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
              <span>0% de commission</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
              <span>Assistance directe</span>
            </div>
          </div>
        </div>

        {/* ── Bouton d'Action Principal ── */}
        <div className="max-w-md mx-auto space-y-3 pt-2">
          <Button
            size="lg"
            className="w-full h-12 sm:h-13 rounded-2xl font-black text-sm sm:text-base gap-2 shadow-lg shadow-primary/25 cursor-pointer transition-all active:scale-[0.99]"
            disabled={payingPlanId === "pro"}
            onClick={() => handlePay("pro")}
          >
            {payingPlanId === "pro" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Connexion sécurisée SasPay…</span>
              </>
            ) : isCurrentPro ? (
              <>
                <ArrowRight className="h-5 w-5" />
                <span>Renouveler mon Plan Pro ({selectedPeriod === "mensuel" ? "3 $" : "30 $"})</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Activer mon Plan Pro ({selectedPeriod === "mensuel" ? "3 $" : "30 $"})</span>
              </>
            )}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Paiement sécurisé via <strong>SasPay</strong> • M-Pesa, Orange Money, Airtel Money, Carte bancaire</span>
          </p>
        </div>
      </section>

{/* ── Historique des Paiements ────────────────────────────────────── */}
      <section className="rounded-3xl border bg-card p-5 sm:p-6 shadow-sm space-y-4">
        {/* En-tête sobre */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="font-bold text-base text-foreground">Historique des paiements</h3>
            <p className="text-xs text-muted-foreground">
              {allHistory.length} transaction{allHistory.length > 1 ? "s" : ""} enregistrée{allHistory.length > 1 ? "s" : ""}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refetchPayments()}
            disabled={paymentsFetching}
            className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground"
            title="Actualiser l'historique"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", paymentsFetching && "animate-spin")} />
          </Button>
        </div>

        {/* Filtres épurés façon contrôle segmenté (sans surcharge de badges) */}
        {allHistory.length > 0 && (
          <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-none">
            {(
              [
                { id: "all", label: "Toutes", count: historyCounts.all },
                { id: "payé", label: "Payées (SasPay)", count: historyCounts.payé },
                ...(historyCounts.attribué > 0
                  ? [{ id: "attribué", label: "Attribuées", count: historyCounts.attribué }]
                  : []),
                { id: "en_attente", label: "En attente", count: historyCounts.en_attente },
                { id: "échoué", label: "Échouées", count: historyCounts.échoué },
              ] as { id: HistoryFilter; label: string; count: number }[]
            ).map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  setHistoryFilter(filter.id);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                  historyFilter === filter.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {filter.label} <span className="opacity-60 text-[11px]">({filter.count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Contenu de la liste */}
        {paymentsLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
            <p>Chargement de l'historique…</p>
          </div>
        ) : allHistory.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
            <Receipt className="h-8 w-8 mx-auto opacity-20" />
            <p className="font-semibold text-sm text-foreground">Aucun paiement effectué</p>
            <p>Vos reçus de paiement s'afficheront ici après votre premier règlement.</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Aucune transaction pour ce filtre</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setHistoryFilter("all");
                setCurrentPage(1);
              }}
              className="rounded-xl text-xs h-8"
            >
              Afficher toutes les transactions
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Liste épurée et sans surcharge de boutons */}
            <div className="divide-y divide-border/60 rounded-2xl border bg-card overflow-hidden">
              {paginatedHistory.map((pay) => {
                const status = resolvePaymentStatus(pay);
                const isUSD = (pay as any).currency === "USD" || pay.montant_usd != null;
                const formattedAmount = isUSD
                  ? formatUSD(Number(pay.montant_usd ?? (pay as any).amount ?? 0))
                  : formatCDF(Number(pay.montant_cdf ?? (pay as any).amount ?? 0));

                const statusDot = {
                  payé: "bg-success",
                  attribué: "bg-info",
                  en_attente: "bg-warning animate-pulse",
                  annulé: "bg-muted-foreground/40",
                  échoué: "bg-destructive",
                }[status];

                const statusLabel = {
                  payé: "Payé",
                  attribué: "Attribué",
                  en_attente: "En attente",
                  annulé: "Annulé",
                  échoué: "Échoué",
                }[status];

                const statusColor = {
                  payé: "text-success dark:text-success font-semibold",
                  attribué: "text-info dark:text-info font-semibold",
                  en_attente: "text-warning dark:text-warning font-semibold",
                  annulé: "text-muted-foreground",
                  échoué: "text-muted-foreground",
                }[status];

                return (
                  <div
                    key={pay.id}
                    onClick={() => setSelectedReceipt(pay)}
                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", statusDot)} />

                      <div className="space-y-0.5 min-w-0">
                        <p className="font-semibold text-sm text-foreground capitalize truncate group-hover:text-primary transition-colors">
                          Plan {pay.plan_id}{" "}
                          <span className="text-muted-foreground font-normal text-xs">
                            · {pay.period || "mensuel"}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {status === "attribué" && (
                            <span className="text-info dark:text-info font-semibold">
                              Plan attribué par l'administrateur ·{" "}
                            </span>
                          )}
                          {new Date(pay.cree_le ?? "").toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-right">
                      <div>
                        {status === "attribué" ? (
                          <>
                            <p className="font-bold text-sm text-info dark:text-info">Attribué</p>
                            <p className="text-[11px] text-muted-foreground">Par l'admin</p>
                          </>
                        ) : (
                          <>
                            <p className="font-black text-sm text-foreground">{formattedAmount}</p>
                            <p className={cn("text-[11px]", statusColor)}>{statusLabel}</p>
                          </>
                        )}
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination discrète */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 px-1 text-xs text-muted-foreground">
                <span className="text-[11px]">
                  Page {currentPage} sur {totalPages}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 rounded-xl px-2.5 text-xs gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Précédent
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 rounded-xl px-2.5 text-xs gap-1"
                  >
                    Suivant <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

            {/* ── FAQ DÉROULANTE ÉPURÉE & UTILE ── */}
      <section className="rounded-3xl border bg-card p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
            <HelpCircle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">Questions fréquentes</h3>
            <p className="text-xs text-muted-foreground">Tout ce que vous devez savoir sur le fonctionnement de votre abonnement</p>
          </div>
        </div>

        <Accordion type="single" collapsible defaultValue="item-1" className="w-full divide-y divide-border/60">
          <AccordionItem value="item-1" className="border-b-0 py-1">
            <AccordionTrigger className="text-left font-semibold text-xs sm:text-sm hover:no-underline py-3 text-foreground">
              Comment payer mon abonnement par Mobile Money ?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-3">
              C'est très simple ! Choisissez votre durée (Mensuel à 3 $ ou Annuel à 30 $), cliquez sur le bouton et validez avec votre compte Mobile Money habituel (<strong>M-Pesa, Orange Money, Airtel Money</strong>) ou par <strong>carte bancaire</strong>. Vous recevrez directement un message sur votre téléphone pour taper votre code secret et valider.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border-b-0 py-1">
            <AccordionTrigger className="text-left font-semibold text-xs sm:text-sm hover:no-underline py-3 text-foreground">
              Est-ce que ma boutique est activée tout de suite ?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-3">
              <strong>Oui, immédiatement !</strong> Dès que vous tapez votre code secret sur votre téléphone, votre paiement est validé automatiquement par SasPay et votre boutique s'active sur-le-champ avec toutes ses options débloquées.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border-b-0 py-1">
            <AccordionTrigger className="text-left font-semibold text-xs sm:text-sm hover:no-underline py-3 text-foreground">
              Est-ce que je perds des jours si je paye avant la fin ?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-3">
              <strong>Non, aucun jour n'est perdu !</strong> Si vous renouvelez avant la date d'échéance, la nouvelle période (1 mois ou 1 an) s'ajoute simplement à la suite de vos jours restants. Vous profitez de chaque journée déjà payée.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="border-b-0 py-1">
            <AccordionTrigger className="text-left font-semibold text-xs sm:text-sm hover:no-underline py-3 text-foreground">
              Que se passe-t-il si mon abonnement arrive à échéance ?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-3">
              Votre boutique ne ferme jamais. Vous basculez simplement sur la <strong>formule Gratuite</strong> (avec un maximum de 10 produits visibles). Tous vos autres articles restent enregistrés et réapparaissent dès que vous réactivez votre Plan Pro.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5" className="border-b-0 py-1">
            <AccordionTrigger className="text-left font-semibold text-xs sm:text-sm hover:no-underline py-3 text-foreground">
              Y a-t-il des commissions sur les ventes que je réalise ?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-3">
              <strong>0% de commission.</strong> Vous gardez 100% de vos ventes. Les clients commandent directement auprès de vous sur WhatsApp et vous payent selon vos propres modalités.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* ── Modale Reçu de Paiement / Attribution (Design Épuré & Élégant) ────────── */}
      <Dialog open={!!selectedReceipt} onOpenChange={(o) => !o && setSelectedReceipt(null)}>
        <DialogContent className="w-[calc(100%-2rem)] sm:w-full sm:max-w-md rounded-3xl p-6 sm:p-7 shadow-lift border bg-background/98 backdrop-blur-xl space-y-0">
          {selectedReceipt && (() => {
            const status = resolvePaymentStatus(selectedReceipt);
            const isAttributed = status === "attribué";
            const isUSD = (selectedReceipt as any).currency === "USD" || selectedReceipt.montant_usd != null;
            const formattedReceiptAmount = isUSD
              ? formatUSD(Number(selectedReceipt.montant_usd ?? selectedReceipt.amount ?? 0))
              : formatCDF(Number(selectedReceipt.montant_cdf ?? selectedReceipt.amount ?? 0));

            const statusConfig = {
              payé: {
                label: "Paiement réussi",
                badgeClass: "bg-success/10 text-success dark:text-success border-success/20",
                icon: CheckCircle2,
              },
              attribué: {
                label: "Plan attribué par l'administrateur",
                badgeClass: "bg-info/10 text-info dark:text-info border-info/20",
                icon: Sparkles,
              },
              en_attente: {
                label: "En attente de paiement",
                badgeClass: "bg-warning/10 text-warning dark:text-warning border-warning/20",
                icon: Clock,
              },
              annulé: {
                label: "Paiement annulé",
                badgeClass: "bg-muted text-muted-foreground border-border",
                icon: XCircle,
              },
              échoué: {
                label: "Non abouti",
                badgeClass: "bg-destructive/10 text-destructive dark:text-destructive border-destructive/20",
                icon: XCircle,
              },
            }[status];

            const StatusIcon = statusConfig.icon;

            return (
              <>
                <DialogHeader className="space-y-1 text-center sm:text-center pb-3">
                  <DialogTitle className="text-base font-bold text-foreground">
                    {isAttributed ? "Attribution de plan" : "Reçu de paiement"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {isAttributed
                      ? "Attribué par l'administrateur · MarketNet"
                      : "Règlement sécurisé SasPay · MarketNet"}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                  {/* Montant & Statut */}
                  <div className={cn(
                    "text-center space-y-1.5 py-4 rounded-2xl border",
                    isAttributed
                      ? "bg-info/50 dark:bg-info/20 border-info/50 dark:border-info/30"
                      : "bg-muted/30 border-border/50"
                  )}>
                    <p className="text-2xl sm:text-3xl font-black text-foreground tracking-normal capitalize">
                      {isAttributed ? `Plan ${selectedReceipt.plan_id}` : formattedReceiptAmount}
                    </p>
                    <div className="flex items-center justify-center">
                      <span className={cn("inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border", statusConfig.badgeClass)}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        <span>{statusConfig.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Détails du paiement en lignes discrètes */}
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Formule</span>
                      <span className="font-bold text-foreground capitalize">
                        Plan {selectedReceipt.plan_id} ({selectedReceipt.period || "mensuel"})
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Date</span>
                      <span className="font-medium text-foreground">
                        {new Date(selectedReceipt.paye_le || selectedReceipt.cree_le).toLocaleString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Moyen</span>
                      <span className="font-medium text-foreground">
                        {isAttributed ? "Attribution administrative" : "SasPay (Mobile Money)"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Boutique</span>
                      <span className="font-medium text-foreground">
                        {shop?.name || "Votre boutique"}
                      </span>
                    </div>

                    {!isAttributed && selectedReceipt.saspay_transaction_id && (
                      <div className="pt-2 border-t flex justify-between items-center text-muted-foreground">
                        <span>Réf.</span>
                        <button
                          type="button"
                          onClick={() => handleCopyRef(selectedReceipt.saspay_transaction_id)}
                          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-foreground hover:text-primary transition-colors max-w-[200px]"
                          title="Cliquer pour copier la référence"
                        >
                          <span className="truncate">{selectedReceipt.saspay_transaction_id}</span>
                          {copiedRef ? (
                            <Check className="h-3 w-3 text-success shrink-0" />
                          ) : (
                            <Copy className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bouton reprendre si en attente */}
                  {selectedReceipt.checkout_url && status === "en_attente" && (
                    <Button
                      className="w-full rounded-2xl font-bold h-11 gap-2 shadow-sm text-xs"
                      onClick={() => {
                        window.location.href = selectedReceipt.checkout_url;
                      }}
                    >
                      Reprendre le paiement SasPay <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  )}

                  {/* Actions si attribué */}
                  {isAttributed && (
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-info/70 dark:bg-info/30 border border-info/50 dark:border-info/30 text-info dark:text-info text-xs leading-relaxed">
                        <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-info dark:text-info" />
                        <span>Plan accordé par l'administrateur MarketNet. Téléchargez votre lettre officielle d'attribution ci-dessous.</span>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full rounded-2xl h-11 font-semibold text-xs gap-2 border-info text-info hover:bg-info dark:border-info dark:text-info dark:hover:bg-info/40 transition-colors"
                        onClick={() => {
                          window.open(`/api/public/invoice-pdf?paymentId=${selectedReceipt.id}`, "_blank");
                        }}
                      >
                        <FileDown className="h-4 w-4" />
                        Télécharger la lettre d'attribution PDF
                      </Button>
                    </div>
                  )}

                  {/* Actions si paiement réussi SasPay réel */}
                  {status === "payé" && (
                    <div className="space-y-2.5">
                      {/* Notice envoi automatique email */}
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-info/70 dark:bg-info/30 border border-info/50 dark:border-info/30 text-info dark:text-info text-[11px] leading-tight">
                        <Mail className="h-4 w-4 shrink-0 text-info dark:text-info" />
                        <span>Facture PDF transmise automatiquement sur votre email de compte.</span>
                      </div>

                      {/* Bouton Télécharger la facture PDF */}
                      <Button
                        variant="outline"
                        className="w-full rounded-2xl h-11 font-semibold text-xs gap-2 border-primary/25 text-primary hover:bg-primary/10 transition-colors"
                        onClick={() => {
                          window.open(`/api/public/invoice-pdf?paymentId=${selectedReceipt.id}`, "_blank");
                        }}
                      >
                        <FileDown className="h-4 w-4" />
                        Télécharger la facture PDF
                      </Button>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => setSelectedReceipt(null)}
                    className="w-full rounded-2xl h-10 font-semibold text-xs border-muted-foreground/20 hover:bg-muted"
                  >
                    Fermer
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

