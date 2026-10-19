import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, LogIn, Mail, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/data-deletion")({
  head: () => ({
    meta: [
      { title: "Suppression des données — MarketNet" },
      {
        name: "description",
        content:
          "Comment supprimer vos données personnelles et votre compte MarketNet. Instructions détaillées pour les commerçants.",
      },
      { property: "og:title", content: "Suppression des données — MarketNet" },
      {
        property: "og:description",
        content:
          "Supprimez votre compte MarketNet et vos données personnelles en quelques étapes simples.",
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
      return data?.value ? String(data.value) : "support@marketnet.cd";
    },
  });

  return (
    <div className="min-h-screen bg-muted/10">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* ── Header nav ── */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-black tracking-tight text-primary hover:opacity-80 transition-opacity"
          >
            MarketNet
          </Link>
          <Button variant="ghost" asChild className="rounded-full">
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </div>

        {/* ── Card ── */}
        <div className="rounded-3xl border bg-card p-8 shadow-sm sm:p-12">
          {/* Title */}
          <div className="mb-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 mb-5">
              <Trash2 className="h-8 w-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Suppression des données
            </h1>
            <p className="mt-3 text-muted-foreground text-lg">
              Vous avez le droit à l'oubli. Voici comment supprimer vos données.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Dernière mise à jour : 19 octobre 2026
            </p>
          </div>

          <div className="space-y-10">
            {/* ── Méthode 1 : Dans l'application ── */}
            <section className="rounded-2xl border bg-muted/30 p-6 sm:p-8">
              <div className="flex items-center gap-4 mb-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <LogIn className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  1. Demander la suppression depuis votre espace MarketNet
                </h2>
              </div>

              <p className="text-muted-foreground text-base sm:text-lg mb-4">
                Si vous avez accès à votre compte, vous pouvez soumettre une demande de suppression directement depuis vos paramètres.
                Afin de protéger vos données et d'éviter toute suppression accidentelle, le processus se déroule avec une période de grâce sécurisée de <strong>30 jours maximum</strong>.
              </p>

              <ol className="space-y-3 mb-5">
                <li className="flex items-start gap-3 text-muted-foreground text-base">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold mt-0.5">1</span>
                  <span>Connectez-vous sur <a href="/auth" className="font-semibold text-primary underline underline-offset-4 hover:opacity-80">MarketNet</a>.</span>
                </li>
                <li className="flex items-start gap-3 text-muted-foreground text-base">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold mt-0.5">2</span>
                  <span>Dans le menu de navigation, accédez à <strong>Réglages</strong> puis faites défiler jusqu'à la section <strong>« Zone de danger »</strong>.</span>
                </li>
                <li className="flex items-start gap-3 text-muted-foreground text-base">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold mt-0.5">3</span>
                  <span>Cliquez sur <strong>« Faire une demande »</strong>, sélectionnez le motif de votre départ et validez. Vous pouvez annuler votre demande tant qu'elle est en attente.</span>
                </li>
                <li className="flex items-start gap-3 text-muted-foreground text-base">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold mt-0.5">4</span>
                  <span>Après traitement par notre équipe, votre boutique est suspendue et une date de suppression définitive est programmée (délai de grâce jusqu'à 30 jours). Vous recevrez un e-mail de notification.</span>
                </li>
              </ol>

              <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
                  <p>
                    <strong>Délai de réflexion et restauration :</strong> Pendant le délai de grâce (jusqu'à 30 jours), vous pouvez contacter notre support pour annuler la suppression et réactiver immédiatement votre boutique.
                  </p>
                  <p className="text-xs opacity-90">
                    Un rappel vous sera automatiquement envoyé par e-mail 7 jours avant l'échéance définitive. Une fois cette date passée, la suppression devient totale et irréversible.
                  </p>
                </div>
              </div>
            </section>

            {/* ── Méthode 2 : Par e-mail ── */}
            <section className="rounded-2xl border bg-muted/30 p-6 sm:p-8">
              <div className="flex items-center gap-4 mb-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Mail className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  2. Demande par e-mail (sans accès au compte)
                </h2>
              </div>

              <p className="text-muted-foreground text-base sm:text-lg mb-4">
                Si vous avez perdu l'accès à vos identifiants de connexion, notre équipe d'assistance peut traiter votre demande manuellement.
              </p>

              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-5">
                <p className="text-sm text-muted-foreground mb-3">
                  Envoyez un message depuis votre adresse e-mail d'inscription en précisant :{" "}
                  <strong>votre adresse e-mail de connexion MarketNet</strong>, le nom de votre
                  boutique (si applicable), et la mention{" "}
                  <em>« Demande de suppression de compte et de données »</em>.
                </p>
                <a
                  href={`mailto:${contactEmail}?subject=Demande%20de%20suppression%20de%20compte%20MarketNet`}
                  className="inline-flex items-center gap-2 font-bold text-primary text-lg hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {contactEmail}
                </a>
              </div>
            </section>

            {/* ── Ce qui est supprimé ── */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-500" />
                Ce qui est supprimé
              </h2>
              <ul className="space-y-3">
                {[
                  "Votre compte utilisateur (e-mail, mot de passe, nom)",
                  "Votre boutique en ligne et son URL publique",
                  "Tous vos produits, catégories, photos et descriptions",
                  "Votre historique de commandes",
                  "Vos statistiques et configurations de boutique",
                  "Votre abonnement et votre historique de facturation",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-muted-foreground text-base sm:text-lg"
                  >
                    <CheckCircle2 className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* ── Contact ── */}
            <div className="mt-8 p-6 bg-muted/50 rounded-2xl border border-muted">
              <h3 className="font-bold text-foreground mb-2">Questions ou droits supplémentaires ?</h3>
              <p className="text-muted-foreground">
                Pour exercer vos droits d'accès, de rectification ou d'opposition, ou pour toute
                question relative à la protection de vos données, contactez-nous à{" "}
                <a
                  href={`mailto:${contactEmail}`}
                  className="font-bold text-primary hover:underline"
                >
                  {contactEmail}
                </a>
                . Consultez également notre{" "}
                <Link
                  to="/privacy"
                  className="font-semibold text-primary underline underline-offset-4 hover:opacity-80"
                >
                  Politique de confidentialité
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="mt-12 text-center text-sm text-muted-foreground flex flex-col sm:flex-row justify-center items-center gap-4">
          <span>&copy; {new Date().getFullYear()} MarketNet. Tous droits réservés.</span>
          <span className="hidden sm:inline">&bull;</span>
          <Link to="/terms" className="hover:text-foreground underline underline-offset-4">
            Conditions d'utilisation (CGU)
          </Link>
          <span className="hidden sm:inline">&bull;</span>
          <Link to="/privacy" className="hover:text-foreground underline underline-offset-4">
            Politique de confidentialité
          </Link>
          <span className="hidden sm:inline">&bull;</span>
          <Link to="/data-deletion" className="hover:text-foreground underline underline-offset-4 font-semibold text-foreground">
            Suppression des données
          </Link>
        </div>
      </div>
    </div>
  );
}
