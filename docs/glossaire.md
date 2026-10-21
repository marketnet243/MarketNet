# Glossaire MarketNet

> Dernière mise à jour : 2026-10-21
> Source : code source et règles métier du projet

---

### A
- **Abonnement** : Forfait souscrit par un commerçant donnant accès aux fonctionnalités de MarketNet selon trois paliers : Gratuit, Pro, Business.
- **Admin (Administrateur)** : Utilisateur disposant du rôle privilégié `admin` lui conférant les pleins pouvoirs de supervision, modération, et configuration sur l'ensemble de la plateforme.
- **Anon (Anonymous)** : Rôle PostgreSQL par défaut attribué à tout internaute ou visiteur navigant sur le site sans session authentifiée.
- **Authenticated** : Rôle PostgreSQL attribué à tout utilisateur connecté possédant un jeton JWT valide émis par Supabase Auth.

### B
- **Broadcast (Diffusion)** : Annonce ou alerte administrative envoyée par les administrateurs vers un ensemble ciblé de commerçants (via bandeau dashboard et notification e-mail).
- **Business (Plan)** : Forfait supérieur de MarketNet offrant un catalogue illimité, un nombre illimité de promotions actives et un support prioritaire.

### C
- **CDF (Franc Congolais)** : Devise monétaire officielle de la République Démocratique du Congo. Devise exclusive de facturation des abonnements MarketNet et des paiements SasPay.
- **Cloudinary** : Plateforme cloud de gestion et de distribution optimisée des images produits et bannières promotionnelles.
- **Commande WhatsApp** : Processus d'achat où le panier d'un client final génère un message texte structuré et pré-rempli transmis directement au numéro WhatsApp du vendeur.
- **Commerçant (Merchant)** : Utilisateur titulaire d'un compte MarketNet et propriétaire d'une boutique en ligne.
- **Cron** : Tâche automatisée récurrente invoquée via HTTP pour assurer la maintenance asynchrone (rappels, purges de comptes, contrôles d'échéances).

### D
- **Délai de grâce (Grace period)** : Période de 3 jours calendaires accordée après la date d'échéance d'un abonnement payant pour permettre au commerçant de renouveler son forfait sans interruption de service.
- **Demande de suppression** : Démarche initiée par un commerçant souhaitant clore son compte, entraînant un gel immédiat de 30 jours avant purge irréversible.

### F
- **Facture PDF** : Document comptable généré côté serveur au format PDF attestant du règlement d'un abonnement par un commerçant.
- **Free (Plan Gratuit)** : Forfait de base sans frais permettant à tout nouveau commerçant de publier jusqu'à 10 produits et 1 promotion active.

### G
- **GRANT** : Instruction SQL PostgreSQL accordant à un rôle spécifique (anon, authenticated, service_role) le droit d'effectuer des opérations (SELECT, INSERT, UPDATE, DELETE) sur une table ou séquence.

### I
- **Idempotence** : Capacité d'un point d'entrée (comme le webhook SasPay) à traiter de multiples requêtes identiques sans générer d'effets de bord indésirables ou de doublons de transaction.

### M
- **Multi-tenant** : Architecture logicielle permettant à une unique instance d'application d'héberger et d'isoler hermétiquement des milliers de boutiques indépendantes.

### N
- **Nodemailer** : Bibliothèque Node.js employée côté serveur pour construire et acheminer les courriels transactionnels via le protocole SMTP.

### P
- **pdf-lib** : Bibliothèque JavaScript légère permettant la manipulation et la génération de documents PDF vectoriels sans navigateur headless.
- **Pro (Plan)** : Forfait intermédiaire de MarketNet permettant la mise en ligne de 200 produits, 5 promotions actives, et l'accès à l'ensemble des 5 modèles visuels de promotion.
- **Promotion** : Campagne marketing temporaire mise en avant sur la vitrine d'une boutique selon 5 gabarits graphiques (`fullscreen`, `split`, `badge`, `minimal`, `countdown`).

### R
- **RLS (Row Level Security)** : Fonctionnalité native du moteur PostgreSQL restreignant l'accès aux lignes d'une table en fonction de critères de sécurité et du profil de l'utilisateur connecté.

### S
- **SasPay** : Passerelle de paiement numérique en RDC supportant le Mobile Money (M-Pesa, Airtel Money, Orange Money) et les cartes bancaires, intégrée pour le paiement des forfaits.
- **Service_role** : Clé et rôle privilégiés de Supabase permettant de contourner les restrictions RLS pour exécuter des opérations d'infrastructure strictement contrôlées côté serveur.
- **Slug** : Identifiant textuel unique formant l'URL publique d'une boutique (ex: `boutique-kinshasa` dans `/b/boutique-kinshasa`).
- **Storefront (Vitrine)** : Interface publique accessible à l'adresse `/b/{slug}` permettant aux internautes de parcourir le catalogue et de commander.

### T
- **TanStack Start** : Méta-framework full-stack moderne pour React associant rendu côté serveur (SSR), routage typé (TanStack Router) et fonctions serveur.
- **Ticket de support** : Fil de discussion horodaté et numéroté (`T-XXXX`) ouvert par un commerçant pour obtenir l'aide des administrateurs.
