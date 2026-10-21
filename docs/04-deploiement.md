# 04 — Déploiement

> Dernière mise à jour : 2026-10-21
> Source : `vercel.json`, `scripts/`, `package.json`, `README.md`

---

## Environnement de production

- **Hébergeur** : Vercel
- **URL de production** : `https://appmarketnet.vercel.app` (valeur par défaut dans le code)
- **Preset** : Nitro (`NITRO_PRESET=vercel`)
- **Branche déployée** : À vérifier dans le tableau de bord Vercel

---

## Commandes

### Développement local
```bash
npm run dev          # Démarre sur http://localhost:8080
npm run test         # Lance Vitest (31 tests)
```

### Build
```bash
npm run build        # Build standard
npm run build:vercel # Build avec preset Vercel (NITRO_PRESET=vercel)
```

### Migrations base de données
```bash
npm run db:migrate   # Applique les migrations non encore appliquées
npm run db:dry-run   # Simule sans appliquer (PowerShell)
npm run db:push      # Applique via CLI Supabase (PowerShell)
npm run db:link      # Lie le projet Supabase local
```

### Administration
```bash
npm run admin:create # Crée ou met à jour le compte administrateur
```

---

## Séquence de déploiement Vercel

Le script `scripts/deploy-prebuild.mjs` s'exécute automatiquement avant chaque build Vercel :

```
Étape 1 : runMigrations()
  └── Lit SUPABASE_DB_MIGRATION_URL ou LOVABLE_DB_MIGRATION_URL
  └── Vérifie les migrations déjà appliquées (supabase_migrations.schema_migrations)
  └── Applique uniquement les nouvelles migrations par ordre chronologique
  └── En cas d'échec : avertissement mais le build continue

Étape 2 : node scripts/create-admin.mjs
  └── Lit MARKETNET_ADMIN_EMAIL, MARKETNET_ADMIN_PASSWORD, MARKETNET_ADMIN_NAME
  └── Crée ou met à jour le compte admin
  └── Attribue le rôle admin (retire les autres rôles)
  └── En cas d'échec : avertissement mais le build continue
```

---

## Variables d'environnement requises en production

À configurer dans le tableau de bord Vercel :

| Variable | Obligatoire | Côté | Description |
|---|---|---|---|
| `SUPABASE_URL` | Oui | Serveur | URL du projet Supabase |
| `VITE_SUPABASE_URL` | Oui | Client | URL du projet Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Oui | Serveur | Clé anon Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Oui | Client | Clé anon Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Oui | Serveur | Clé service_role (jamais exposée) |
| `SUPABASE_DB_MIGRATION_URL` | Oui | Scripts | URL directe PostgreSQL pour migrations |
| `SASPAY_ENV` | Oui | Serveur | `live` en production |
| `SASPAY_SECRET_KEY` | Oui | Serveur | Clé API SasPay live |
| `SASPAY_WEBHOOK_SECRET` | Oui | Serveur | Secret webhook SasPay |
| `CLOUDINARY_CLOUD_NAME` | Oui | Serveur | Nom du cloud Cloudinary |
| `CLOUDINARY_API_KEY` | Oui | Serveur | Clé API Cloudinary |
| `CLOUDINARY_API_SECRET` | Oui | Serveur | Secret Cloudinary |
| `SMTP_HOST` | Oui | Serveur | Serveur SMTP (ex. smtp.gmail.com) |
| `SMTP_PORT` | Oui | Serveur | Port SMTP (465 recommandé) |
| `SMTP_USER` | Oui | Serveur | Adresse expéditrice |
| `SMTP_PASSWORD` | Oui | Serveur | Mot de passe SMTP |
| `SMTP_FROM_NAME` | Non | Serveur | Nom affiché (défaut : MarketNet) |
| `CRON_SECRET` | Oui | Serveur | Token pour authentifier les crons |
| `MARKETNET_ADMIN_EMAIL` | Oui | Serveur | E-mail admin (notifications + création) |
| `MARKETNET_ADMIN_PASSWORD` | Oui (scripts) | Scripts | Mot de passe admin initial |
| `MARKETNET_ADMIN_NAME` | Non | Scripts | Nom d'affichage admin |
| `MARKETNET_SITE_URL` | Oui | Serveur | URL production pour les e-mails et PDF |

---

## Migrations SQL

Les migrations sont dans `supabase/migrations/` et numérotées chronologiquement.

**Règle** : les migrations sont **additives uniquement**. Ne jamais supprimer ni modifier une migration déjà appliquée.

Le script `run-migrations.mjs` :
1. Crée le schéma `supabase_migrations` si absent
2. Lit les migrations déjà appliquées
3. Détecte si la base existait avant le système de tracking (heuristique sur `user_roles`)
4. Applique chaque nouvelle migration dans l'ordre
5. Enregistre chaque migration appliquée dans `schema_migrations`

---

## Tâches planifiées (Crons)

Les routes cron sont dans `src/routes/api/cron/`. Elles sont protégées par `CRON_SECRET`.

| Route | Cadence recommandée | Rôle |
|---|---|---|
| `POST /api/cron/process-account-deletions` | Toutes les 10 minutes | Rappels J-7 + suppressions définitives |
| `POST /api/cron/subscription-reminders` | Quotidienne | Rappels d'expiration d'abonnement |

> **À vérifier** : la configuration des crons dans le tableau de bord Vercel (Cron Jobs) ou via un service externe. La cadence exacte n'est pas visible dans `vercel.json`.

---

## Points fragiles connus

1. **Migration URL** : Si `SUPABASE_DB_MIGRATION_URL` est absente, les migrations sont silencieusement ignorées. Toujours vérifier après un premier déploiement.
2. **Admin bootstrap** : Si `MARKETNET_ADMIN_EMAIL` ou `MARKETNET_ADMIN_PASSWORD` sont absents, le script de création admin échoue mais ne bloque pas le build. L'admin doit être créé manuellement.
3. **Crons non configurés** : Les routes cron existent mais ne seront pas appelées automatiquement sans configuration externe (Vercel Cron Jobs, GitHub Actions ou autre).
4. **Cloudinary fallback** : Si les variables Cloudinary sont absentes, les uploads échoueront sans message clair. Vérifier au premier test d'ajout de produit.
5. **SMTP silencieux** : Si les variables SMTP sont absentes, les e-mails ne sont pas envoyés mais aucune erreur bloquante n'est levée (comportement intentionnel). Les entrées dans `notification_outbox` seront en statut `échoué`.
6. **Double client Supabase** : `SUPABASE_URL` et `VITE_SUPABASE_URL` sont deux variables distinctes pointant vers la même valeur. Les deux doivent être configurées.
