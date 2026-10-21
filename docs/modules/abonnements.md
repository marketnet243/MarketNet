# Abonnements et plans — Actif

> Dernière mise à jour : 2026-10-21
> Source : `src/lib/subscriptions.ts`, `src/lib/subscriptions.functions.ts`, `src/routes/_authenticated/dashboard.abonnement.tsx`, `supabase/migrations/20261014000000_saspay_and_subscriptions.sql`

---

## 1. À quoi ça sert

Gère le cycle de vie des abonnements SaaS des commerçants MarketNet : choix du forfait (Gratuit, Pro, Business), tarification mensuelle ou annuelle exclusivement en Franc Congolais (CDF / FC), suivi de la période de validité, période de grâce de 3 jours, et rétrogradation douce vers le plan gratuit sans perte irrémédiable de données en cas d'expiration.

---

## 2. Qui l'utilise

- [x] Commerçant (consultation de son statut, sélection d'offre, initiation de paiement)
- [x] Administrateur (ajustement manuel, attribution de plans gratuits/partenaires, gestion des prix)
- [ ] Client final

---

## 3. Parcours utilisateur

```
1. Découverte et sélection (/dashboard/abonnement)
   └── Affichage du plan courant, date d'échéance et quotas consommés
   └── Grille comparative des plans (Gratuit, Pro, Business)
   └── Sélecteur de cycle : Mensuel (1 mois) ou Annuel (12 mois avec réduction)

2. Souscription payante
   └── Clic sur « Choisir ce plan » ou « Renouveler »
   └── Appel serveur createSaspayCheckoutSessionFn
   └── Redirection vers la page de paiement sécurisée SasPay

3. Expiration et grâce
   └── J-7 et J-2 : Rappels par e-mail
   └── Date d'échéance atteinte : Entrée en période de grâce (3 jours)
   └── Fin de grâce : Rétrogradation automatique vers le plan Gratuit
   └── Les produits et promotions excédant les limites sont masqués temporairement (non supprimés)
```

---

## 4. Écrans et routes

| Route | Fichier | Description |
|---|---|---|
| `/dashboard/abonnement` | `src/routes/_authenticated/dashboard.abonnement.tsx` | Vue commerçant : état actuel, sélection et paiement |
| `/admin/plans` | `src/routes/_authenticated/admin.plans.tsx` | Vue admin : configuration des plans, tarifs CDF et quotas |

---

## 5. Données

### Tables utilisées

| Table | Opérations | Notes |
|---|---|---|
| `plans` | SELECT (public), UPDATE (admin) | Définition des plans (id: free, pro, business) |
| `plan_prices` | SELECT (public), UPDATE (admin) | Tarifs en CDF (mensuel, annuel) synchronisés par trigger |
| `merchant_subscriptions` | SELECT (own), INSERT/UPDATE (serveur/admin) | Historique et état des souscriptions |
| `shops` | SELECT, UPDATE (`plan_id`, `plan_expires_at`) | Champs protégés par trigger `shop_plan_guard` |

### Colonnes importantes (`merchant_subscriptions`)
- `shop_id` : référence de la boutique
- `plan_id` : plan souscrit (`free`, `pro`, `business`)
- `cycle` : `mensuel` ou `annuel`
- `statut` : `actif`, `en_grace`, `expire`, `resilie`
- `date_debut` / `date_fin` : période de validité
- `grace_until` : date de fin de la période de grâce (+3 jours après `date_fin`)

---

## 6. Logique serveur

### Fonctions serveur (`src/lib/subscriptions.functions.ts`)

| Fonction | Rôle |
|---|---|
| `getCurrentSubscriptionFn` | Récupère le statut actuel de la boutique, le plan actif et les limites |
| `createSaspayCheckoutSessionFn` | Initialise un paiement SasPay pour un cycle et un plan donnés |
| `grantPlanManuallyFn` | Attribution administrative manuelle d'un plan avec motif et lettre PDF |

### Logique métier partagée (`src/lib/subscriptions.ts`)

- `computeEffectiveSubscriptionStatus()` : calcule l'état réel (`active`, `in_grace`, `expired`) selon les dates
- `identifyExcessItemsToPause()` : détermine quels produits ou promotions doivent être masqués lors d'un downgrade

---

## 7. E-mails et notifications

| Déclencheur | Destinataire | Fonction |
|---|---|---|
| Rappel J-7 avant expiration | Commerçant | Cron `subscription-reminders` |
| Rappel J-2 avant expiration | Commerçant | Cron `subscription-reminders` |
| Entrée en grâce | Commerçant | Cron `subscription-reminders` |
| Confirmation de souscription | Commerçant | E-mail avec facture PDF attachée |
| Attribution manuelle par l'admin | Commerçant | E-mail avec lettre d'attribution PDF officielle |

---

## 8. Règles métier

### Grille standard des plans (source migrations)

| Paramètre | Gratuit | Pro | Business |
|---|---|---|---|
| Prix mensuel indicatif | 0 FC | 25 000 FC | 70 000 FC |
| Prix annuel indicatif | 0 FC | 250 000 FC | 700 000 FC |
| Max produits | 10 | 200 | Illimité |
| Max photos / produit | 3 | 6 | 6 |
| Promotions actives max | 1 | 5 | Illimité |
| Templates autorisés | fullscreen, split, minimal | Tous (5 templates) | Tous (5 templates) |
| Badge vérifié | Non | Oui | Oui |
| Support prioritaire | Non | Standard | Dédié / Prioritaire |

> Les prix réels peuvent être ajustés depuis l'admin et sont stockés dans `plan_prices`.

---

## 9. Dépendances avec d'autres modules

- [Paiements SasPay](paiements-saspay.md) : exécution des transactions mobiles et cartes en CDF
- [Factures et e-mails](factures-emails.md) : génération des quittances et reçus PDF
- [Produits](produits.md) et [Promotions](promotions.md) : application des quotas stricts
- [Tâches planifiées](taches-planifiees.md) : cron d'alerte et de transition d'état

---

## 10. Sécurité — ce qui est vérifié côté serveur

- Le montant payé n'est **jamais transmis par le client** : la fonction serveur lit le tarif directement depuis la table `plan_prices`.
- `shops.plan_id` et `shops.plan_expires_at` sont défendus par le trigger PostgreSQL `shop_plan_guard()` qui interdit toute modification directe par un utilisateur authentifié non admin.

---

## 11. Limites connues et points à vérifier

- À vérifier : la désactivation effective des produits excédentaires doit être périodiquement auditée si un cron échoue.
- À vérifier : exactitude des montants promotionnels annuels configurés en base de production.

---

## 12. Fichiers source principaux

- `src/lib/subscriptions.ts`
- `src/lib/subscriptions.functions.ts`
- `src/routes/_authenticated/dashboard.abonnement.tsx`
- `src/routes/_authenticated/admin.plans.tsx`
- `supabase/migrations/20261014000000_saspay_and_subscriptions.sql`
- `supabase/migrations/20261015000000_update_plan_prices_cdf.sql`
