# Points d'attention et dette technique — MarketNet

> Dernière mise à jour : 2026-10-21
> Source : audit exhaustif de l'architecture, du code source et des migrations

---

## 1. Risques critiques et sécurité

### 1.1 Politiques GRANT sur les tables tarifaires (`plans` et `plan_prices`)
- **Constat** : Dans certaines migrations initiales, les droits `INSERT, UPDATE, DELETE` ont été accordés au rôle `authenticated` sur les tables `plans` et `plan_prices`.
- **Mitigation actuelle** : La politique RLS bloque l'écriture aux non-admins (`has_role(auth.uid(), 'admin')`).
- **Recommandation** : Restreindre explicitement le GRANT au rôle `admin` ou `service_role` uniquement pour éviter tout risque en cas de mauvaise configuration ultérieure de la RLS.

### 1.2 Échéance Supabase du 30 octobre 2026
- **Constat** : Supabase modifie la politique par défaut d'attribution de privilèges sur les nouvelles tables du schéma `public`.
- **Règle absolue** : Toute migration future ajoutant une table doit obligatoirement inclure dans le même fichier les instructions `GRANT` adaptées à `anon`, `authenticated` ou `service_role`, sous peine de provoquer des erreurs `permission denied` silencieuses ou bloquantes en production.

---

## 2. Dépendances et intégrations externes

### 2.1 Configuration des Crons en production
- **Constat** : Les endpoints `/api/cron/process-account-deletions` et `/api/cron/subscription-reminders` sont pleinement implémentés et protégés par `CRON_SECRET`. Cependant, la configuration du planificateur déclencheur (ex: Vercel Cron Jobs dans `vercel.json` ou service externe) doit être validée et testée en conditions réelles.
- **Risque** : Si les crons ne sont pas déclenchés, les comptes en cours de suppression ne seront pas purgés et les rappels de fin d'abonnement ne partiront pas.

### 2.2 Délivrabilité des e-mails (SMTP)
- **Constat** : Nodemailer gère les envois via les variables `SMTP_*`.
- **Recommandation** : Configurer impérativement les enregistrements DNS `SPF`, `DKIM` et `DMARC` sur le domaine expéditeur afin d'éviter le placement des factures et liens de réinitialisation en boîte de courriers indésirables (Spam).

### 2.3 Double stockage d'images (Cloudinary vs Supabase Storage)
- **Constat** : Le système utilise majoritairement Cloudinary pour les photos de produits optimisées en WebP. Un résidu d'ancien système Supabase Storage (`shop-media`) subsiste avec un endpoint proxy `/api/public/media/*`.
- **Recommandation** : Exécuter le script de migration `scripts/migrate-supabase-media-to-cloudinary.mjs` si des médias anciens existent encore sur Supabase Storage, puis déprécier définitivement le bucket local.

---

## 3. Cohérence du Design et de l'Expérience Utilisateur

### 3.1 Utilisation d'emojis dans les modèles d'e-mails
- **Constat** : Alors que les règles de style de MarketNet prescrivent une interface sobre et professionnelle sans emojis, certains gabarits d'e-mails dans `src/lib/support-email.server.ts` contiennent encore des icônes de type 🎫 ou 💬.
- **Action suggérée** : Harmoniser les gabarits pour respecter strictement la tonalité éditoriale épurée.

### 3.2 Mode sombre sur le tableau de bord
- **Constat** : Le design system supporte les thèmes clairs et sombres pour les vitrines de boutique publiques (ex: thème `minuit`), mais le tableau de bord commerçant et l'espace administrateur ne sont conçus qu'en thème clair. Ne pas tenter d'ajouter de bascule sombre sans retravailler toutes les variables du dashboard.

---

## 4. Performance et scalabilité

### 4.1 Envoi d'e-mails de diffusion (Broadcasts)
- **Constat** : Lorsqu'un administrateur publie une diffusion générale avec l'option e-mail, la fonction serveur itère sur l'ensemble des destinataires.
- **Recommandation future** : Lorsque le nombre de commerçants inscrits dépassera le millier, déporter cet envoi vers un système de file asynchrone (Background Job / Queue) pour éviter de saturer la limite de temps d'exécution des fonctions serverless (timeout 15 à 60 secondes).

### 4.2 Panier en mémoire locale
- **Constat** : Le panier des acheteurs finaux est conservé en état mémoire local React sans persistance dans le `localStorage`.
- **Conséquence** : Un rafraîchissement accidentel de la page vide le panier de l'acheteur. Une amélioration ergonomique consisterait à synchroniser le panier avec le `localStorage` du navigateur.
