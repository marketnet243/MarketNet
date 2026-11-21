import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/imported-database";
import {
  Trash2,
  LogIn,
  Mail,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Clock,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/data-deletion")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Suppression des données — MarketNet" },
      {
        name: "description",
        content:
          "Modalités et instructions officielles pour demander la suppression définitive de votre compte et de vos données sur MarketNet.",
      },
      { property: "og:title", content: "Suppression des données — MarketNet" },
      {
        property: "og:description",
        content:
          "Supprimez votre compte MarketNet et vos données personnelles en quelques étapes simples et transparentes.",
      },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: DataDeletionPage,
});

function DataDeletionPage() {
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
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-xs">
            <Trash2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Suppression des données &amp; Compte
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed">
            Conformément aux normes de protection de la vie privée, vous bénéficiez du droit à l'effacement total de vos
            informations personnelles et de vos boutiques MarketNet.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Période de réflexion garantie : 30 jours</span>
          </div>
        </div>

        {/* ── Méthode 1 : Depuis l'application (Recommandée) ── */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LogIn className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Option 1 — Immédiate</span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                  Depuis votre espace commerçant MarketNet
                </h2>
              </div>
            </div>

            <Button asChild className="rounded-xl h-10 px-4 text-xs font-bold shadow-xs self-start sm:self-auto">
              <Link to="/dashboard/reglages" search={{ tab: "suppression" }}>
                Accéder au formulaire de suppression <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Si vous êtes connecté ou possédez vos identifiants, suivez ces 4 étapes simples :
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-850 p-4 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold mt-0.5">
                  1
                </span>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">Connexion à votre compte</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Connectez-vous sur votre tableau de bord commerçant.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-850 p-4 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold mt-0.5">
                  2
                </span>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">Onglet Suppression</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rendez-vous dans <strong>Paramètres</strong> &gt; <strong>Demande de suppression</strong>.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-850 p-4 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold mt-0.5">
                  3
                </span>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">Motif &amp; Confirmation</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sélectionnez le motif de départ et confirmez en saisissant votre mot de passe.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-850 p-4 border border-slate-200/70 dark:border-slate-800 flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold mt-0.5">
                  4
                </span>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100">Délai de grâce de 30 jours</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Votre boutique est mise en pause. Vous pouvez annuler à tout moment pendant 30 jours.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Note d'avertissement */}
          <div className="flex items-start gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 p-4 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Délai de rétractation et sécurité :</p>
              <p className="leading-relaxed opacity-95">
                Pendant les 30 jours suivant la demande, vos données sont conservées de façon sécurisée mais invisibles
                du public. Vous recevrez un rappel par e-mail 7 jours avant la purge définitive. Passé ce délai,
                l'effacement devient irréversible.
              </p>
            </div>
          </div>
        </div>

        {/* ── Méthode 2 : Sans accès au compte (Par e-mail) ── */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Option 2 — Assistance</span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                Demande par e-mail (en cas de perte d'identifiants)
              </h2>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Si vous n'arrivez plus à vous connecter à votre compte, transmettez votre demande par message électronique
            depuis l'adresse e-mail associée à votre boutique :
          </p>

          <div className="rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-3">
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Éléments à indiquer dans votre message :</p>
              <ul className="list-disc pl-5 space-y-1 pt-1">
                <li>Votre adresse e-mail d'inscription à MarketNet</li>
                <li>Le nom de votre boutique ou le lien public</li>
                <li>L'objet : « Demande de suppression de compte commerçant »</li>
              </ul>
            </div>

            <div className="pt-2">
              <a
                href={`mailto:${contactEmail}?subject=Demande%20de%20suppression%20de%20compte%20MarketNet`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
              >
                <Mail className="h-4 w-4" />
                <span>Envoyer un e-mail à {contactEmail}</span>
              </a>
            </div>
          </div>
        </div>

        {/* ── Ce qui est supprimé ── */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <span>Données supprimées lors de l'opération</span>
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            Une fois le délai de grâce expiré, notre système supprime définitivement et sans possibilité de récupération :
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {[
              "Votre profil et identifiants de connexion (e-mail, mot de passe hashé)",
              "L'ensemble de vos boutiques et leurs sous-domaines attribués",
              "Tous les produits, descriptions, catégories et photos hébergées",
              "L'historique complet des commandes reçues et coordonnées associées",
              "Vos bannières promotionnelles et configurations graphiques",
              "Vos factures, abonnements et registres d'activités",
            ].map((text, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
              >
                <CheckCircle2 className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Liens de navigation complémentaires ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-slate-100/70 dark:bg-slate-850 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span>Des questions sur la confidentialité de vos données ?</span>
          </div>
          <div className="flex items-center gap-4 font-semibold">
            <Link to="/privacy" className="text-primary hover:underline">
              Politique de confidentialité
            </Link>
            <span>·</span>
            <Link to="/terms" className="text-primary hover:underline">
              Conditions Générales (CGU)
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
