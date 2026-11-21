import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Copy,
  Check,
  Package,
  ShoppingBag,
  ArrowRight,
  ExternalLink,
  Tag,
  Palette,
  Zap,
  Globe,
  Share2,
  Clock,
  QrCode,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";
import { supabase } from "@/lib/imported-database";
import { useMyShop, useShopProducts } from "@/hooks/useMyShop";
import { getMerchantSubscription } from "@/lib/subscriptions.functions";
import { ShopQrDialog } from "@/components/dashboard/ShopQrDialog";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { property: "og:title", content: "Tableau de bord — MarketNet" },
      { property: "og:description", content: "Vue d'ensemble de votre boutique." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Tableau de bord — MarketNet" },
      { name: "description", content: "Vue d'ensemble de votre boutique." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { data: shop } = useMyShop();
  const { data: products } = useShopProducts(shop?.id);
  const getSubFn = useServerFn(getMerchantSubscription);

  const { data: subData } = useQuery({
    queryKey: ["merchantSubscription", shop?.id],
    enabled: !!shop?.id,
    queryFn: () => getSubFn({ data: { shopId: shop!.id } }),
    staleTime: 60 * 1000,
  });

  const { data: orders } = useQuery({
    queryKey: ["orders", shop?.id],
    enabled: !!shop,
    queryFn: async () =>
      (
        await supabase
          .from("orders")
          .select("*")
          .eq("shop_id", shop!.id)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const { data: promoCount } = useQuery({
    queryKey: ["promotionsCount", shop?.id],
    enabled: !!shop?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("promotions")
        .select("*", { count: "exact", head: true })
        .eq("shop_id", shop!.id);
      return count ?? 0;
    },
  });

  const [copied, setCopied] = useState(false);

  // Détection de la période de grâce
  const isGracePeriod = subData?.is_grace_period || subData?.status === "grâce";
  const graceDaysRemaining = subData?.grace_ends_at
    ? Math.max(1, Math.ceil((new Date(subData.grace_ends_at).getTime() - Date.now()) / (24 * 3600 * 1000)))
    : (subData?.days_remaining ?? 7);

  // Détection limite plan gratuit
  const isPro = subData?.plan_id === "pro" && subData?.status === "actif";
  const productCount = products?.length ?? 0;
  const isFreePlanNearOrAtLimit = !isPro && productCount >= 8;

  // Détection numéro WhatsApp configuré
  const hasWhatsapp = Boolean(
    shop?.whatsapp || (shop as any)?.whatsapp_number || (shop as any)?.phone
  );

  // Calcul dynamique de la checklist de complétion de la boutique
  const checklist = useMemo(() => {
    if (!shop) return [];
    return [
      {
        id: "logo",
        title: "Logo et bannière de marque",
        desc: "Donnez une identité visuelle claire à votre vitrine",
        done: Boolean(shop.logo_url && shop.banner_url),
        to: "/dashboard/boutique",
        action: "Personnaliser",
      },
      {
        id: "products",
        title: "Ajouter au moins 3 produits",
        desc: `${productCount} produit${productCount > 1 ? "s" : ""} actuellement en ligne`,
        done: productCount >= 3,
        to: "/dashboard/produits",
        action: "Ajouter des produits",
      },
      {
        id: "whatsapp",
        title: "Numéro WhatsApp pour les commandes",
        desc: hasWhatsapp
          ? "Numéro de commande WhatsApp actif"
          : "Obligatoire pour que vos clients puissent passer commande",
        done: hasWhatsapp,
        to: "/dashboard/boutique",
        action: "Configurer WhatsApp",
      },
      {
        id: "promotions",
        title: "Lancer votre première offre ou promotion",
        desc: (promoCount ?? 0) > 0 ? "Offres promotionnelles actives" : "Augmentez vos ventes avec des prix barrés ou bannières",
        done: (promoCount ?? 0) > 0,
        to: "/dashboard/promotions",
        action: "Créer une offre",
      },
    ];
  }, [shop, productCount, promoCount, hasWhatsapp]);

  const completedSteps = checklist.filter((item) => item.done).length;
  const totalSteps = checklist.length;
  const completionPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  // Ne garder QUE les étapes qui ne sont pas encore faites
  const pendingSteps = checklist.filter((item) => !item.done);

  if (!shop) return null;

  // Calcul sécurisé et complet de l'URL publique absolue
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const host = typeof window !== "undefined" ? window.location.host : "marketnet.cd";
  const cleanHost = host.includes("localhost") ? "marketnet.cd" : host;
  const publicShopUrl = origin ? `${origin}/b/${shop.slug}` : `/b/${shop.slug}`;
  const displayUrl = `${cleanHost}/b/${shop.slug}`;
  const recentOrders = orders?.slice(0, 5) ?? [];

  const handleCopy = async () => {
    const success = await copyToClipboard(publicShopUrl);
    if (success) {
      setCopied(true);
      toast.success("Lien officiel de la boutique copié !");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Impossible de copier automatiquement.");
    }
  };

  const handleShare = async () => {
    const text = `Bonjour ! Découvrez les produits de ma boutique ${shop.name} et passez commande directement en ligne : ${publicShopUrl}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shop.name,
          text,
          url: publicShopUrl,
        });
        return;
      } catch (e) {
        // Fallback WhatsApp
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-12">
      {/* ── 1. BANNIÈRE PÉRIODE DE GRÂCE ── */}
      {isGracePeriod && (
        <div className="flex items-center gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 animate-in fade-in">
          <Clock className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex-1 leading-snug">
            Période de grâce —{" "}
            <strong>
              {graceDaysRemaining} jour{graceDaysRemaining > 1 ? "s" : ""} restant{graceDaysRemaining > 1 ? "s" : ""}
            </strong>
            . Renouvelez pour maintenir vos avantages Pro.
          </p>
          <Link
            to="/dashboard/abonnement"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-xs"
          >
            <Zap className="h-3.5 w-3.5" /> Renouveler (3 $)
          </Link>
        </div>
      )}

      {/* ── 1b. BANNIÈRE LIMITE DU PLAN GRATUIT ── */}
      {!isGracePeriod && isFreePlanNearOrAtLimit && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 px-4 py-3.5 animate-in fade-in shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Limite du forfait Gratuit ({productCount}/10 produits)
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {productCount >= 10
                  ? "Vous avez atteint le quota maximal de 10 produits. Débloquez le Plan Pro pour ajouter des produits en illimité."
                  : "Vous approchez du quota maximal de 10 produits. Activez le Plan Pro pour profiter d'un catalogue illimité."}
              </p>
            </div>
          </div>
          <Link
            to="/dashboard/abonnement"
            className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs transition-all shadow-xs self-start sm:self-auto"
          >
            <Zap className="h-3.5 w-3.5" /> Débloquer le Pro (3 $)
          </Link>
        </div>
      )}

      {/* ── 2. BLOC ÉTAT / STATUT DU CATALOGUE ── */}
      <div className="rounded-2xl bg-white border border-slate-200/80 px-4 sm:px-5 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-800">
            {products && products.length > 0
              ? "Boutique opérationnelle et prête à vendre"
              : "Ajoutez vos premiers articles dans le catalogue"}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
          {products?.length ?? 0} produit(s) en ligne
        </span>
      </div>

      {/* ── 3. ACTIVITÉ BOUTIQUE — sans montants monétaires ── */}
      <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-xs border border-slate-200/70 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-100">
          <ShoppingBag className="h-3.5 w-3.5 text-primary" />
          <span>ACTIVITÉ DE LA BOUTIQUE</span>
        </div>

        {/* 4 métriques sans montants */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Commandes
            </span>
            <span className="text-2xl font-black text-slate-900 block">{orders?.length ?? 0}</span>
            <span className="text-[10px] text-slate-400 block">Total reçues</span>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Produits
            </span>
            <span className="text-2xl font-black text-slate-900 block">{products?.length ?? 0}</span>
            <span className="text-[10px] text-slate-400 block">En catalogue</span>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Vues boutique
            </span>
            <span className="text-2xl font-black text-slate-900 block">{shop.views ?? 0}</span>
            <span className="text-[10px] text-slate-400 block">Visiteurs uniques</span>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              En attente
            </span>
            <span className="text-2xl font-black text-slate-900 block">
              {orders?.filter((o: any) => o.status === "new").length ?? 0}
            </span>
            <span className="text-[10px] text-slate-400 block">À traiter</span>
          </div>
        </div>
      </div>

      {/* ── 4. FICHE BOUTIQUE & LIEN CLIENT + CODE QR ── */}
      <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-xs border border-slate-200/70 space-y-4">
        {/* Identité de la boutique */}
        <div className="flex items-center gap-3.5">
          {shop.logo_url ? (
            <img
              src={shop.logo_url}
              alt={shop.name}
              className="h-12 w-12 rounded-2xl object-cover shrink-0 border border-slate-200 shadow-xs"
            />
          ) : (
            <div className="h-12 w-12 rounded-2xl bg-primary text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-xs">
              {shop.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg text-slate-900 truncate">{shop.name}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                {shop.is_published ? "Boutique en ligne" : "Aperçu privé"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {products?.length ?? 0} produit(s) en ligne · {shop.views ?? 0} vue{(shop.views ?? 0) > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Bloc URL de la boutique */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
              <Globe className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <a
                href={publicShopUrl}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-xs sm:text-sm text-slate-900 hover:text-primary transition-colors flex items-center gap-1.5 truncate"
              >
                <span className="truncate">{displayUrl}</span>
                <span className="text-slate-400 font-normal">· Visiter mon site</span>
                <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
              <span>{copied ? "Lien copié !" : "Copier le lien"}</span>
            </button>
          </div>
        </div>

        {/* Boutons d'action horizontaux : Partager + QR Code + Ouvrir */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 shadow-xs transition-colors cursor-pointer"
          >
            <Share2 className="h-4 w-4 text-primary" />
            <span>Partager le lien</span>
          </button>

          <ShopQrDialog
            shopName={shop.name}
            shopSlug={shop.slug}
            shopUrl={publicShopUrl}
            logoUrl={shop.logo_url}
            trigger={
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 shadow-xs transition-colors cursor-pointer"
              >
                <QrCode className="h-4 w-4 text-primary" />
                <span>Afficher le QR Code</span>
              </button>
            }
          />

          <a
            href={publicShopUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 shadow-xs transition-colors"
          >
            <ExternalLink className="h-4 w-4 text-slate-600" />
            <span>Ouvrir la vitrine</span>
          </a>
        </div>
      </div>

      {/* ── 5. SUGGESTIONS : CE QU'IL RESTE À FAIRE ── */}
      <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-xs border border-slate-200/70 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Guide de lancement &amp; suggestions
              </h2>
              <p className="text-xs text-slate-400">
                {pendingSteps.length > 0
                  ? "Actions recommandées pour optimiser votre boutique"
                  : "Votre boutique est parfaitement configurée !"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-extrabold text-primary">{completionPercent}%</span>
            <div className="w-24 sm:w-28">
              <Progress value={completionPercent} className="h-2 rounded-full" />
            </div>
          </div>
        </div>

        {/* Si toutes les étapes sont faites : message propre de félicitations */}
        {pendingSteps.length === 0 ? (
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
                Félicitations, tout est configuré !
              </p>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                Votre boutique dispose de tous les éléments essentiels. Partagez votre lien ou votre Code QR pour recevoir vos premières commandes.
              </p>
            </div>
          </div>
        ) : (
          /* N'afficher QUE les étapes restantes non encore configurées */
          <div className="space-y-2.5">
            {pendingSteps.map((step) => (
              <div
                key={step.id}
                className="flex items-center justify-between p-3.5 rounded-2xl border bg-white border-slate-200/80 hover:border-primary/40 shadow-2xs transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {step.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{step.desc}</p>
                  </div>
                </div>

                <Link
                  to={step.to}
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors"
                >
                  <span>{step.action}</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 6. ACTIONS CLÉS RAPIDES ── */}
      <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-xs border border-slate-200/70 space-y-3">
        <div className="divide-y divide-slate-100">
          <Link
            to="/dashboard/boutique"
            className="flex items-center justify-between py-3.5 group hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Modifier mon site</h3>
                <p className="text-xs text-slate-400 mt-0.5">Personnaliser l'apparence, logo, bannière et coordonnées</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to="/dashboard/produits"
            className="flex items-center justify-between py-3.5 group hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Ajouter un produit</h3>
                <p className="text-xs text-slate-400 mt-0.5">Nouveau produit ou service dans votre catalogue</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            to="/dashboard/promotions"
            className="flex items-center justify-between py-3.5 group hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Créer une promotion</h3>
                <p className="text-xs text-slate-400 mt-0.5">Offres et bannières promotionnelles interactives</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </div>

      {/* ── 7. DERNIÈRES COMMANDES ── */}
      <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-xs border border-slate-200/70 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Dernières commandes</h2>
            <p className="text-xs text-slate-400 mt-0.5">Commandes reçues de vos clients</p>
          </div>
          <Link
            to="/dashboard/commandes"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
          >
            <span>Voir tout</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <ShoppingBag className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Aucune commande pour l'instant</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Partagez votre lien de boutique pour recevoir vos premières commandes.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((order: any) => {
              const statusLabels: Record<string, { label: string; class: string }> = {
                new: { label: "Nouveau", class: "bg-primary/10 text-primary border border-primary/20" },
                processing: { label: "En cours", class: "bg-blue-50 text-blue-700 border-blue-200" },
                completed: { label: "Terminée", class: "bg-slate-100 text-slate-700 border-slate-200" },
                cancelled: { label: "Annulée", class: "bg-rose-50 text-rose-700 border-rose-200" },
              };
              const status = statusLabels[order.status] || {
                label: order.status,
                class: "bg-slate-100 text-slate-600 border-slate-200",
              };

              return (
                <Link
                  key={order.id}
                  to={`/dashboard/commandes`}
                  className="flex items-center justify-between py-3 hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                      #{String(order.id).slice(-4)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{order.customer_name || "Client WhatsApp"}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(order.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-slate-900">
                      {order.total_amount ? `${Number(order.total_amount).toLocaleString("fr-FR")} $` : "—"}
                    </span>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${status.class}`}>
                      {status.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
