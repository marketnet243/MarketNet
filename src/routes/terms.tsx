import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Scale, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Conditions Générales d'Utilisation (CGU) — MarketNet" },
      {
        name: "description",
        content:
          "Conditions Générales d'Utilisation du service MarketNet pour les commerçants et créateurs de boutiques en ligne.",
      },
      { property: "og:title", content: "Conditions Générales d'Utilisation — MarketNet" },
      {
        property: "og:description",
        content:
          "Consultez les règles, modalités d'abonnement et responsabilités sur la plateforme MarketNet.",
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
      return data?.value ? String(data.value) : "support@marketnet.cd";
    },
  });

  return (
    <div className="min-h-screen bg-muted/10">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="text-xl font-black tracking-tight text-primary hover:opacity-80 transition-opacity">
            MarketNet
          </Link>
          <Button variant="ghost" asChild className="rounded-full">
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </div>

        <div className="rounded-3xl border bg-card p-8 shadow-sm sm:p-12">
          <div className="mb-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5">
              <Scale className="h-8 w-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">Conditions Générales d'Utilisation</h1>
            <p className="mt-3 text-muted-foreground text-lg">Règles et modalités d'utilisation de nos services.</p>
            <p className="mt-1 text-xs text-muted-foreground">Dernière mise à jour : 19 octobre 2026</p>
          </div>

          <div className="space-y-12">
            
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">Bienvenue sur MarketNet</h2>
              <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
                MarketNet est une plateforme technologique SaaS permettant aux commerçants et entrepreneurs de créer et gérer facilement leur boutique en ligne, de publier leurs catalogues et d'acheminer les commandes de leurs clients directement sur WhatsApp. En utilisant nos services, vous acceptez sans réserve les présentes conditions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">1. Votre boutique, vos règles</h2>
              <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
                Vous êtes l'unique responsable de votre boutique, de vos stocks, de la conformité de vos prix et de la relation avec vos clients. Vous vous engagez formellement à ne vendre aucun produit illégal, contrefait, dangereux ou soumis à restriction légale en République Démocratique du Congo, et à toujours honorer de bonne foi les commandes passées par vos clients.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">2. Abonnements et Paiements</h2>
              <div className="text-muted-foreground leading-relaxed text-base sm:text-lg space-y-3">
                <p>
                  L'accès aux options avancées (nombre élargi de produits, bannières promotionnelles, thèmes personnalisés, statistiques détaillées) dépend du forfait souscrit. Les règlements s'effectuent en Francs Congolais (CDF) par Mobile Money (M-Pesa, Airtel Money, Orange Money) ou Carte Bancaire via SasPay.
                </p>
                <p>
                  <strong>En cas de non-renouvellement d'un forfait payant (ex: forfait Pro) :</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2 text-base">
                  <li>Une période de grâce de <strong>7 jours</strong> vous est accordée pour renouveler votre forfait sans aucune interruption.</li>
                  <li>Passé ce délai de grâce, votre compte repasse automatiquement sur le <strong>forfait Gratuit</strong> : les fonctionnalités avancées sont temporairement bloquées pour ne laisser actives que celles du forfait gratuit.</li>
                  <li>Les produits dépassant le quota autorisé par le forfait gratuit sont <strong>temporairement désactivés de la vitrine publique</strong> (ils ne sont jamais supprimés de votre compte).</li>
                  <li>Dès que vous renouvelez votre abonnement, <strong>tout se réactive automatiquement</strong> : vos produits masqués réapparaissent instantanément et vos fonctionnalités avancées sont débloquées sans aucune perte.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">3. Commandes et Rôle de MarketNet</h2>
              <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
                MarketNet fournit une vitrine technique et redirige l'acheteur vers le WhatsApp du commerçant pour finaliser la commande. MarketNet n'intervient pas dans la livraison des marchandises, n'encaisse pas les montants des ventes de produits et ne prélève aucune commission sur vos transactions directes avec vos clients.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">4. Sécurité et Modération</h2>
              <p className="text-muted-foreground leading-relaxed text-base sm:text-lg mb-4">
                Afin de garantir un écosystème sain et de protéger les consommateurs, l'équipe MarketNet se réserve le droit d'intervenir :
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-muted-foreground text-base sm:text-lg">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <span><strong>Suspension temporaire d'une boutique :</strong> en cas de signalements répétés, d'usurpation d'identité ou de suspicion avérée d'escroquerie.</span>
                </li>
                <li className="flex items-start gap-3 text-muted-foreground text-base sm:text-lg">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <span><strong>Suppression immédiate et définitive :</strong> si des produits interdits, contrefaçons manifestes ou contenus illicites sont publiés sur la vitrine.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">5. Données et Confidentialité</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-muted-foreground text-base sm:text-lg">
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2.5" />
                  <span><strong>Vos données marchandes :</strong> Vos informations de contact et configurations sont strictement protégées et ne sont jamais vendues ni cédées à des tiers.</span>
                </li>
                <li className="flex items-start gap-3 text-muted-foreground text-base sm:text-lg">
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2.5" />
                  <span><strong>Données de vos acheteurs :</strong> Vous vous engagez à respecter la vie privée de vos clients et à ne pas divulguer ni exploiter leurs numéros WhatsApp à des fins de spam.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">6. Résiliation et Suppression de compte</h2>
              <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
                Vous êtes libre de cesser d'utiliser MarketNet à tout moment. Vous pouvez introduire une demande de suppression de compte depuis l'onglet Réglages de votre tableau de bord ou par e-mail. Afin de prévenir toute perte involontaire, un délai de grâce pouvant aller jusqu'à <strong>30 jours</strong> s'applique avant la purge irréversible de vos catalogues et images. Consultez la page{" "}
                <Link to="/data-deletion" className="font-semibold text-primary underline underline-offset-4 hover:opacity-80">
                  Suppression des données
                </Link>{" "}
                pour le détail de la procédure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">7. Propriété intellectuelle</h2>
              <p className="text-muted-foreground leading-relaxed text-base sm:text-lg">
                MarketNet demeure titulaire exclusif des droits sur le logiciel, l'interface et le code source. Cependant, vous restez l'unique propriétaire de l'ensemble des contenus, marques, logos et photographies que vous publiez sur votre boutique.
              </p>
            </section>

            <div className="mt-8 p-6 bg-muted/50 rounded-2xl border border-muted">
              <h3 className="font-bold text-foreground mb-2">Nous contacter</h3>
              <p className="text-muted-foreground">
                Pour toute question relative aux présentes conditions ou pour signaler un litige, veuillez nous écrire à :{" "}
                <a href={`mailto:${contactEmail}`} className="font-bold text-primary hover:underline">{contactEmail}</a>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground flex flex-col sm:flex-row justify-center items-center gap-4">
          <span>&copy; {new Date().getFullYear()} MarketNet. Tous droits réservés.</span>
          <span className="hidden sm:inline">&bull;</span>
          <Link to="/terms" className="font-semibold text-foreground underline underline-offset-4">Conditions d'utilisation (CGU)</Link>
          <span className="hidden sm:inline">&bull;</span>
          <Link to="/privacy" className="hover:text-foreground underline underline-offset-4">Politique de confidentialité</Link>
          <span className="hidden sm:inline">&bull;</span>
          <Link to="/data-deletion" className="hover:text-foreground underline underline-offset-4">Suppression des données</Link>
        </div>
      </div>
    </div>
  );
}
