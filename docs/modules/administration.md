# Administration globale — Actif

> Dernière mise à jour : 2026-10-21
> Source : `src/routes/_authenticated/admin.tsx`, `src/routes/_authenticated/admin.*.tsx`, `src/lib/admin.functions.ts`

---

## 1. À quoi ça sert

Constitue le centre de commande de la plateforme MarketNet réservé aux administrateurs. Il permet de superviser l'ensemble de l'activité (statistiques clés, revenus consolidés en Franc Congolais, nouveaux commerçants), de modérer les boutiques et les contenus, d'ajuster les plans tarifaires, de gérer les paiements et attributions manuelles, et de traiter les tickets de support et suppressions de comptes.

---

## 2. Qui l'utilise

- [ ] Commerçant
- [x] Administrateur (accès complet sous condition du rôle `admin`)
- [ ] Client final

---

## 3. Parcours utilisateur

```
1. Authentification admin (/auth)
   └── Détection du rôle dans user_roles -> redirection automatique vers /admin

2. Tableau de bord principal (/admin)
   └── Cartes d'indicateurs (KPIs) : Total boutiques actives, Volume d'affaires estimé,
       Revenus abonnements CDF, Nouveaux inscrits sur 30 jours, Tickets en attente
   └── Graphiques d'évolution (inscriptions et encaissements)

3. Modules de gestion dédiés :
   ├── /admin/commercants : Liste, recherche, suspension ou réactivation de comptes
   ├── /admin/boutiques : Modération des vitrines, consultation directe, forçage de slug
   ├── /admin/plans : Ajustement des tarifs mensuels/annuels en CDF, quotas produits/promos
   ├── /admin/paiements : Suivi SasPay, validation manuelle, attribution de forfaits gratuits
   ├── /admin/support : Traitement des tickets commerçants et publication de diffusions
   └── /admin/demandes-suppression : Suivi des comptes en période de préavis de 30 jours
```

---

## 4. Écrans et routes

| Route | Fichier | Description |
|---|---|---|
| `/admin` | `src/routes/_authenticated/admin.index.tsx` | Vue d'ensemble, métriques globales et KPIs |
| `/admin/commercants` | `src/routes/_authenticated/admin.commercants.tsx` | Gestion des utilisateurs et comptes commerçants |
| `/admin/boutiques` | `src/routes/_authenticated/admin.boutiques.tsx` | Annuaire des boutiques, suspension et modération |
| `/admin/plans` | `src/routes/_authenticated/admin.plans.tsx` | Configuration des offres tarifaires et limites |
| `/admin/paiements` | `src/routes/_authenticated/admin.paiements.tsx` | Transactions SasPay, attributions manuelles et quittances |
| `/admin/support` | `src/routes/_authenticated/admin.support.tsx` | Centre d'assistance et création des diffusions |
| `/admin/demandes-suppression` | `src/routes/_authenticated/admin.demandes-suppression.tsx` | Supervision des purges de données |

---

## 5. Données

### Rôles et autorisations

- Table `user_roles` : l'utilisateur doit posséder une entrée avec `role = 'admin'`.
- Fonction de sécurité : `has_role(auth.uid(), 'admin')` utilisée dans toutes les politiques RLS pour déverrouiller l'accès complet en lecture et écriture sur toutes les tables de l'application.

---

## 6. Logique serveur

### Fonctions serveur (`src/lib/admin.functions.ts` & `src/lib/subscriptions.functions.ts`)

| Fonction | Rôle |
|---|---|
| `getAdminDashboardStatsFn` | Agrège les chiffres d'affaires CDF, nombre de commerçants et alertes |
| `toggleShopSuspensionFn` | Suspend ou réactive une boutique avec motif consigné dans `audit_log` |
| `grantPlanManuallyFn` | Accorde un plan (ex: partenariat) avec génération automatique de la lettre PDF |
| `notifyMerchantWelcome` | Déclenche les alertes admin lors de la création d'une nouvelle boutique |

---

## 7. Journal d'audit (`audit_log`)

Toutes les actions administratives sensibles sont enregistrées de façon immuable dans la table `audit_log` :
- Suspension / réactivation de boutique
- Attribution manuelle d'un abonnement
- Modification directe d'un slug
- Suppression accélérée ou forçage administratif

Colonnes : `admin_id`, `action`, `target_type`, `target_id`, `details` (JSONB), `created_at`.

---

## 8. Règles métier

- L'accès à `/admin/*` est strictement barricadé : tout utilisateur non admin est redirigé vers `/dashboard` ou `/auth`.
- Les administrateurs peuvent inspecter n'importe quel catalogue sans altérer les compteurs statistiques (les visites admin ne comptent pas dans `shops.views`).

---

## 9. Dépendances avec d'autres modules

- L'espace administrateur supervise **l'ensemble** des modules de MarketNet.

---

## 10. Sécurité — ce qui est vérifié côté serveur

- Contrôle strict via le middleware serveur `requireSupabaseAuth` combiné à la vérification de rôle.
- Utilisation de `supabaseAdmin` (`service_role`) uniquement pour les tâches de maintenance irréalisables sous le contexte utilisateur.

---

## 11. Limites connues et points à vérifier

- Création du premier compte admin : réalisée via le script sécurisé `scripts/create-admin.mjs` (inclus dans la séquence de pré-déploiement).

---

## 12. Fichiers source principaux

- `src/routes/_authenticated/admin.tsx` (Layout admin avec sidebar dédiée)
- `src/routes/_authenticated/admin.*.tsx`
- `src/lib/admin.functions.ts`
- `src/hooks/useIsAdmin.ts`
- `scripts/create-admin.mjs`
