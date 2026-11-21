import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/imported-database";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Share2,
  Trash2,
  FileText,
  Clock,
  HelpCircle,
} from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Politique de Confidentialité — MarketNet" },
      {
        name: "description",
        content:
          "Politique de confidentialité et protection des données personnelles de la plateforme MarketNet.",
      },
      { property: "og:title", content: "Politique de Confidentialité — MarketNet" },
      {
        property: "og:description",
        content: "Découvrez comment MarketNet protège et traite vos données personnelles avec rigueur et transparence.",
      },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
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
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Politique de Confidentialité
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
            Protection rigoureuse, transparence et respect de votre vie privée et de celle de vos clients.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Mise à jour : Novembre 2026</span>
          </div>
        </div>

        {/* ── Contenu principal en cartes structurées ── */}
        <div className="space-y-6">
          {/* Section Présentation */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <FileText className="h-5 w-5 text-primary" />
              <span>Présentation de MarketNet</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              MarketNet est une plateforme technologique SaaS permettant aux commerçants et créateurs de marques de
              déployer facilement leur vitrine de vente en ligne, de publier leurs catalogues de produits et de recevoir
              leurs commandes directement via WhatsApp. Nous attachons une importance primordiale à la confidentialité de vos
              informations.
            </p>
          </div>

          {/* Section 1 : Données collectées */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>1. Données collectées auprès des commerçants</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Pour administrer et sécuriser votre compte, MarketNet collecte les informations essentielles suivantes :
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {[
                { title: "Identité & Contact", desc: "Nom, e-mail, numéro de téléphone et numéro WhatsApp commercial." },
                { title: "Informations Boutique", desc: "Nom commercial, devise, logo, bannière, adresse et ville." },
                { title: "Catalogue & Médias", desc: "Titres de produits, descriptions, prix et photographies hébergées." },
                { title: "Historique & Facturation", desc: "Commandes reçues, statut de la formule et sessions SasPay." },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 space-y-1"
                >
                  <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">{item.title}</h3>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2 : Clients de vos boutiques */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <Share2 className="h-5 w-5 text-blue-600" />
              <span>2. Données des acheteurs et clients finaux</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              MarketNet ne contraint pas vos acheteurs à créer un compte. Vos clients parcourent librement votre vitrine
              publique. Lorsqu'un client valide son panier, son récapitulatif de commande est directement transmis vers votre
              numéro WhatsApp. Aucun profilage publicitaire tiers n'est effectué sur vos clients.
            </p>
          </div>

          {/* Section 3 : Paiements & Sécurité */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-3">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <Lock className="h-5 w-5 text-amber-600" />
              <span>3. Sécurité et Paiements d'abonnement (SasPay)</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Les transactions d'abonnements Pro sont opérées par <strong>SasPay</strong> en devises USD et Francs Congolais (CDF).
              MarketNet ne conserve aucune coordonnée bancaire, code PIN Mobile Money ni numéro de carte de crédit. Nos serveurs
              communiquent exclusivement par protocoles chiffrés SSL/TLS.
            </p>
          </div>

          {/* Section 4 : Droit à l'oubli et suppression */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                <Trash2 className="h-5 w-5 text-destructive" />
                <span>4. Droit d'accès, rectification et suppression</span>
              </h2>
              <Link
                to="/data-deletion"
                className="text-xs font-bold text-primary hover:underline shrink-0"
              >
                Page de suppression &rarr;
              </Link>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Vous pouvez à tout moment exporter, modifier ou solliciter la suppression intégrale de vos données. Les demandes
              de suppression font l'objet d'un délai de grâce de 30 jours pour prévenir toute erreur accidentelle, avant
              effacement définitif et complet de nos bases.
            </p>
          </div>

          {/* Contact d'assistance */}
          <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xs space-y-3">
            <h3 className="font-bold text-base">Questions relatives à vos données ?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pour exercer vos droits ou contacter notre délégué à la protection des données, écrivez-nous à :
            </p>
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
            >
              {contactEmail}
            </a>
          </div>
        </div>

        {/* ── Pied de page navigation ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-100/70 dark:bg-slate-850 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span>Consultez l'ensemble de nos engagements juridiques</span>
          </div>
          <div className="flex items-center gap-4 font-semibold">
            <Link to="/terms" className="text-primary hover:underline">
              Conditions Générales d'Utilisation
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
