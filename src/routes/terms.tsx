import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/imported-database";
import {
  Scale,
  CheckCircle2,
  CreditCard,
  ShoppingBag,
  ShieldCheck,
  AlertTriangle,
  Clock,
  HelpCircle,
} from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Conditions Générales d'Utilisation (CGU) — MarketNet" },
      {
        name: "description",
        content:
          "Conditions Générales d'Utilisation du service MarketNet pour les commerçants, marchands et créateurs de boutiques.",
      },
      { property: "og:title", content: "Conditions Générales d'Utilisation — MarketNet" },
      {
        property: "og:description",
        content:
          "Consultez les règles d'utilisation, formules d'abonnement et responsabilités sur la plateforme MarketNet.",
      },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { data: contactEmail } = useQuery({
    queryKey: ["contact_email_public"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "contact_email")
        .maybeSingle();
      return data?.value ? String(data.value) : "marketnet243@gmail.com";
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
      <PublicHeader solid />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10">
        {/* ── En-tête de page ── */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
            <Scale className="h-8 w-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
            Règles d'exploitation, engagements mutuels et modalités d'abonnement au service MarketNet.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Version en vigueur : Novembre 2026</span>
          </div>
        </div>

        {/* ── Cartes de contenu ── */}
        <div className="space-y-6">
          {/* 1. Objet et acceptation */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>1. Objet du service &amp; Rôle de MarketNet</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              MarketNet fournit une suite d'outils logiciels SaaS permettant aux professionnels, marchands et artisans de
              créer et héberger une vitrine de catalogue numérique, de partager leur lien public et de recevoir des bons de
              commandes directement via l'application de messagerie WhatsApp. MarketNet n'est ni grossiste ni revendeur,
              n'intervient pas dans les livraisons physiques et ne prélève aucune commission sur les transactions directes
              entre acheteurs et commerçants.
            </p>
          </div>

          {/* 2. Responsabilité du commerçant */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span>2. Responsabilité et conformité des produits</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Le commerçant est seul et entièrement responsable de l'exactitude de ses descriptifs de produits, de ses prix, de
              la détention des stocks et de la qualité des marchandises livrées. Sont formellement prohibés sur MarketNet tous
              produits illégaux, contrefaçons, substances contrôlées ou stupéfiants, armes, ainsi que tout contenu attentatoire
              aux lois en vigueur en République Démocratique du Congo.
            </p>
          </div>

          {/* 3. Abonnements, Forfait Gratuit & Plan Pro */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              <span>3. Modalités d'Abonnement et Paiement (SasPay)</span>
            </h2>
            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-3 leading-relaxed">
              <p>
                MarketNet propose une formule <strong>Gratuite</strong> (incluant jusqu'à 10 produits) et un{" "}
                <strong>Plan Pro</strong> facturé à <strong>3 $ USD par mois</strong> (ou 30 $ USD par an), payable en Dollars
                Américains ou leur équivalent en Francs Congolais (CDF) par Mobile Money (M-Pesa, Airtel Money, Orange Money) ou
                Carte Bancaire via SasPay.
              </p>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-850 p-4 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Règles de transition et Période de grâce (7 jours) :
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs">
                  <li>
                    À l'échéance du Plan Pro, une <strong>période de grâce de 7 jours</strong> s'active automatiquement, durant
                    laquelle l'ensemble de vos avantages illimités reste pleinement accessible sans interruption.
                  </li>
                  <li>
                    Si aucun renouvellement n'intervient à l'issue de ces 7 jours, le compte bascule automatiquement vers le
                    forfait Gratuit : vos produits excédant le quota de 10 sont <strong>mis en pause</strong> de la vitrine
                    publique, sans jamais être supprimés.
                  </li>
                  <li>
                    Dès renouvellement de l'abonnement, l'intégralité de vos articles et promotions est réactivée instantanément.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 4. Résiliation & Suppression de compte */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span>4. Résiliation et Droit de retrait</span>
              </h2>
              <Link to="/data-deletion" className="text-xs font-bold text-primary hover:underline shrink-0">
                Procédure de suppression &rarr;
              </Link>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Le commerçant peut résilier son engagement ou solliciter la clôture de sa boutique à tout moment. Les demandes
              effectuées via la plateforme bénéficient d'un délai de rétractation de 30 jours, durant lequel la vitrine est
              masquée du public tout en autorisant une réactivation immédiate en cas de changement d'avis.
            </p>
          </div>

          {/* Assistance */}
          <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xs space-y-3">
            <h3 className="font-bold text-base">Besoin d'informations contractuelles ?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Notre équipe d'assistance se tient à votre disposition pour toute question :
            </p>
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
            >
              {contactEmail}
            </a>
          </div>
        </div>

        {/* ── Pied de page ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-100/70 dark:bg-slate-850 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span>Documents juridiques associés</span>
          </div>
          <div className="flex items-center gap-4 font-semibold">
            <Link to="/privacy" className="text-primary hover:underline">
              Politique de Confidentialité
            </Link>
            <span>·</span>
            <Link to="/data-deletion" className="text-primary hover:underline">
              Suppression des données
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
