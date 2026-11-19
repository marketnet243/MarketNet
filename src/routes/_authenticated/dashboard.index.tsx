import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Copy,
  Check,
  Eye,
  Package,
  ShoppingBag,
  MessageCircle,
  ArrowRight,
  ExternalLink,
  Tag,
  Palette,
  Zap,
  Globe,
  TrendingUp,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/imported-database";
import { useMyShop, useShopProducts } from "@/hooks/useMyShop";
import { cn } from "@/lib/utils";

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

  const [copied, setCopied] = useState(false);
  const [period, setPeriod] = useState<"today" | "7d" | "30d" | "all">("7d");

  if (!shop) return null;

  const url = typeof window !== "undefined" ? `${window.location.origin}/b/${shop.slug}` : `/b/${shop.slug}`;
  const displayUrl = `${shop.slug}.marketnet.cd`;

  const newOrders = orders?.filter((o) => o.status === "new").length ?? 0;
  const recentOrders = orders?.slice(0, 5) ?? [];

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien copié dans le presse-papier !");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* ── 1. BANNIÈRE PRO / ABONNEMENT (Palette Vytrini : Indigo #4F46E5 & Lavande #EEF2FF) ── */}
      <div className="rounded-3xl bg-[#EEF2FF] border border-[#E0E7FF] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-[#4F46E5] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Zap className="h-5 w-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base text-slate-900">Activer mon site</h2>
              <span className="rounded-full bg-[#4F46E5]/15 text-[#4F46E5] text-[10px] font-extrabold px-2 py-0.5 uppercase tracking-wider">
                {shop.plan_id ? `Mode ${shop.plan_id}` : "Mode Gratuit"}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed max-w-md">
              Domaine personnalisé, catalogue illimité et commandes directes pour vendre comme un pro.
            </p>
          </div>
        </div>

        <Link
          to="/dashboard/abonnement"
          className="self-start sm:self-auto shrink-0 px-5 py-2.5 rounded-full bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold transition-all shadow-xs"
        >
          {shop.plan_id ? "Gérer mon abonnement" : "S'abonner – 9,99 $/mois"}
        </Link>
      </div>

      {/* ── 2. BLOC ÉTAT / À FAIRE MAINTENANT (Sobre, sans vert criard) ── */}
      <div className="rounded-2xl bg-white border border-slate-200/80 px-4 sm:px-5 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-slate-900" />
          <span className="text-xs font-bold text-slate-800">
            {products && products.length > 0 ? "Tout est à jour" : "Ajoutez vos premiers produits dans le catalogue"}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
          {products?.length ?? 0} produit(s) en ligne
        </span>
      </div>

      {/* ── 3. ACTIVITÉ & ENCAISSEMENTS (Style Vytrini : Filtres pilules noires) ── */}
      <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-xs border border-slate-200/70 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>ENCAISSÉ &amp; ACTIVITÉ</span>
          </div>

          {/* Filtres de période (Vytrini style : pilule noire active) */}
          <div className="flex items-center bg-slate-100/90 p-0.5 rounded-full text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setPeriod("today")}
              className={cn(
                "px-3 py-1 rounded-full transition-all cursor-pointer",
                period === "today" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              onClick={() => setPeriod("7d")}
              className={cn(
                "px-3 py-1 rounded-full transition-all cursor-pointer",
                period === "7d" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              7 jours
            </button>
            <button
              type="button"
              onClick={() => setPeriod("30d")}
              className={cn(
                "px-3 py-1 rounded-full transition-all cursor-pointer",
                period === "30d" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              30 jours
            </button>
            <button
              type="button"
              onClick={() => setPeriod("all")}
              className={cn(
                "px-3 py-1 rounded-full transition-all cursor-pointer",
                period === "all" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Depuis le début
            </button>
          </div>
        </div>

        {/* 4 Chiffres Clés minimalistes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Vues du site</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{shop.views ?? 0}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Visiteurs sur la période</span>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Catalogue</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{products?.length ?? 0}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Produits en ligne</span>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Commandes</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{orders?.length ?? 0}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Total commandes</span>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">En attente</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{newOrders}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">À traiter</span>
          </div>
        </div>
      </div>

      {/* ── 4. FICHE BOUTIQUE & LIEN CLIENT (Exactement la carte Vytrini) ── */}
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
            <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-xs">
              {shop.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg text-slate-900 truncate">{shop.name}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                {shop.is_published ? "Boutique en ligne" : "Aperçu privé"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {products?.length ?? 0} produit en ligne · Mis à jour récemment
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
                href={url}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-xs sm:text-sm text-slate-900 hover:text-[#4F46E5] transition-colors flex items-center gap-1.5 truncate"
              >
                <span className="truncate">{displayUrl}</span>
                <span className="text-slate-400 font-normal">· Visiter mon site</span>
                <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-slate-900" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
            <span>{copied ? "Lien copié !" : "Copier le lien"}</span>
          </button>
        </div>

        {/* Boutons d'action horizontaux en pilules blanches (Vytrini style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Bonjour ! Découvrez les produits de ma boutique ${shop.name} et passez commande directement en ligne : ${url}`)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 shadow-xs transition-colors"
          >
            <Share2 className="h-4 w-4 text-slate-600" />
            <span>Partager le lien</span>
          </a>

          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 shadow-xs transition-colors"
          >
            <ExternalLink className="h-4 w-4 text-slate-600" />
            <span>Ouvrir la vitrine</span>
          </a>
        </div>
      </div>

      {/* ── 5. ACTIONS CLÉS (Style Vytrini : 3 blocs horizontaux nets) ── */}
      <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-xs border border-slate-200/70 space-y-3">
        <div className="divide-y divide-slate-100">
          {/* Action 1 : Modifier mon site */}
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

          {/* Action 2 : Ajouter un produit */}
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
                <p className="text-xs text-slate-400 mt-0.5">Nouveau produit ou service dans ton catalogue</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
          </Link>

          {/* Action 3 : Promotions */}
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

      {/* ── 6. DERNIÈRES COMMANDES WHATSAPP ── */}
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
                new: { label: "Nouveau", class: "bg-slate-900 text-white border-slate-900" },
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
