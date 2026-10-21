# Journal des travaux — MarketNet

> Dernière mise à jour : 2026-10-21
> La plus récente entrée est toujours en haut.

---

## Modèle d'entrée (copier-coller au début du fichier)

```
---

## [DATE] — [TITRE DE LA TÂCHE]

**Demande reçue** : [résumé en 1-2 phrases de ce qui était demandé]

**Ce qui a été fait** :
- [action 1]
- [action 2]

**Fichiers créés ou modifiés** :
- `chemin/fichier.tsx` — [raison]

**Migrations ajoutées** :
- `supabase/migrations/YYYYMMDD_nom.sql` — [description]
  - Tables créées : [liste]
  - GRANT : [exemple concis]
  - RLS : [politiques ajoutées]

**Comment tester** :
1. [étape concrète]
2. [étape concrète]

**Ce qui n'a pas été fait / reste à vérifier** :
- [point ouvert]

**Documents mis à jour** :
- `docs/modules/[module].md`
- `docs/glossaire.md`
- `docs/points-attention.md`
```

---

## 2026-10-21 — Optimisation responsive mobile des e-mails transactionnels et diffusions

**Demande reçue** : Les utilisateurs se plaignent que sur mobile, la carte des e-mails reçus (notamment les diffusions/annonces) apparaît étroite avec un grand espace vide inutilisé sur les côtés de l'écran.

**Ce qui a été fait** :
- Diagnostic sur le gabarit d'e-mail officiel (`buildEmailShell` et `buildBroadcastHtml`) : le `padding: 24px` sur le `<body>` combiné à l'absence de wrapper 100% et de media queries forçait l'e-mail dans une colonne étroite (~260px utiles sur ~400px d'écran).
- Remplacement du `padding: 24px` du body par un wrapper HTML complet responsive avec table 100% de fond.
- Ajout de règles CSS `@media only screen and (max-width: 600px)` adaptées à Gmail Android/iOS, Apple Mail et Outlook Mobile : padding extérieur réduit à 4px sur mobile (permettant à la carte d'occuper ~98% de la largeur de l'écran), paddings internes ajustés, typographie et badges proportionnés.
- Application de la structure responsive aux autres gabarits d'e-mails (`invoices.server.ts` et `account-deletion-email.server.ts`).

**Fichiers créés ou modifiés** :
- `src/lib/support-email.server.ts` — Optimisation mobile de `buildEmailShell` et `buildBroadcastHtml`
- `src/lib/invoices.server.ts` — Optimisation mobile de `buildInvoiceHtml`, `buildAssignmentLetterHtml`, `buildNewUserAdminAlertHtml` et `buildMerchantWelcomeHtml`
- `src/lib/account-deletion-email.server.ts` — Optimisation mobile de `buildShell`

**Migrations ajoutées** : aucune

**Comment tester** :
1. Lancer `npm run test` (31 tests Vitest au vert).
2. Déclencher une diffusion test depuis `/admin/support` ou visualiser le rendu HTML d'un e-mail sur un écran mobile : la carte s'étend désormais sur toute la largeur disponible avec une marge subtile et propre de 4px de chaque côté, sans colonnes vides démesurées.

**Ce qui n'a pas été fait / reste à vérifier** :
- Tester le rendu visuel direct sur plusieurs clients de messagerie physiques réels (Gmail Android en thème sombre et clair, Apple Mail iOS).

**Documents mis à jour** :
- `docs/journal-des-travaux.md`

---

## 2026-10-21 — Création de la documentation initiale MarketNet

**Demande reçue** : Créer la documentation complète du projet MarketNet dans un dossier `docs/`, module par module, sans modifier aucun code applicatif.

**Ce qui a été fait** :
- Analyse complète du dépôt : routes, migrations SQL (20 fichiers), composants, hooks, fonctions serveur, scripts de déploiement, templates e-mails, styles CSS
- Création de la structure `docs/` et `docs/modules/`
- Rédaction de tous les fichiers documentaires listés ci-dessous

**Fichiers créés** :
- `docs/AGENTS.md` — règles obligatoires pour tout agent
- `docs/README.md` — sommaire général
- `docs/journal-des-travaux.md` — ce fichier
- `docs/design-system.md` — charte de design réelle
- `docs/regles-supabase.md` — règles GRANT et RLS
- `docs/00-vue-ensemble.md` — présentation générale
- `docs/01-architecture.md` — pile technique et architecture
- `docs/02-base-de-donnees.md` — tables, relations, RLS
- `docs/03-securite-et-roles.md` — authentification et sécurité
- `docs/04-deploiement.md` — déploiement et variables d'environnement
- `docs/glossaire.md` — termes du projet
- `docs/points-attention.md` — dette technique et risques
- `docs/modules/_modele.md` — modèle vide réutilisable
- `docs/modules/authentification.md`
- `docs/modules/boutiques.md`
- `docs/modules/produits.md`
- `docs/modules/promotions.md`
- `docs/modules/panier-commande.md`
- `docs/modules/abonnements.md`
- `docs/modules/paiements-saspay.md`
- `docs/modules/factures-emails.md`
- `docs/modules/support-tickets.md`
- `docs/modules/diffusion.md`
- `docs/modules/suppression-compte.md`
- `docs/modules/administration.md`
- `docs/modules/taches-planifiees.md`
- `docs/modules/pages-legales.md`
- `docs/modules/navigation.md`

**Migrations ajoutées** : aucune (tâche de documentation uniquement)

**Comment tester** :
1. Ouvrir `docs/README.md` et vérifier que tous les liens internes pointent vers des fichiers existants
2. Lire `docs/AGENTS.md` et vérifier que les règles sont claires et applicables
3. Ouvrir un fichier de module (par ex. `docs/modules/promotions.md`) et vérifier la cohérence avec le code source

**Ce qui n'a pas été fait / reste à vérifier** :
- Les GRANT et RLS des tables existantes n'ont pas été vérifiés en base de production (accès non disponible) — voir `docs/points-attention.md`
- La section Meta/Facebook du module initial était désactivée (migration `20261017000000_remove_meta_module.sql`) : non documentée comme module actif
- Les valeurs réelles des tarifs CDF (25 000 FC pro, 70 000 FC business) sont dans la migration `20261015000000` mais peuvent avoir été modifiées par l'admin — À vérifier en base
- La cadence exacte des crons Vercel n'est pas visible dans `vercel.json` — À vérifier

**Documents mis à jour** :
- Création initiale de tous les documents
