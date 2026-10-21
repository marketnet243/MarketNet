# Boutiques et réglages — Actif

> Dernière mise à jour : 2026-10-21
> Source : `src/routes/_authenticated/dashboard.boutique.tsx`, `dashboard.reglages.tsx`, `onboarding.tsx`, `src/components/dashboard/ShopFields.tsx`

---

## 1. À quoi ça sert

Permet à un commerçant de créer sa boutique en ligne, de la personnaliser (thème, couleurs, logo, bannière, réseaux sociaux, horaires) et de la gérer (publication, réglages, demande de suppression). Chaque commerçant peut avoir exactement une boutique.

---

## 2. Qui l'utilise

- [x] Commerçant (création et gestion)
- [x] Administrateur (modération et modification)
- [ ] Client final

---

## 3. Parcours utilisateur

```
Création (onboarding) :
1. /onboarding (après inscription si pas de boutique)
   └── Formulaire ShopFields : nom, slug, catégorie, logo, bannière,
       WhatsApp, ville, adresse, horaires, réseaux sociaux
   └── Thème prédéfini + couleur principale
   └── Aperçu temps réel (ShopPreview mobile/desktop)
   └── Création en base → notification admin → e-mail bienvenue
   └── Redirection vers /onboarding (écran festif avec lien boutique)

Modification :
1. /dashboard/boutique
   └── Mêmes champs que la création
   └── Slug modifiable une seule fois (verrou après première modification)

Réglages et zone de danger :
1. /dashboard/reglages
   └── Informations de contact
   └── Résumé du plan actuel
   └── Demande de suppression de compte
```

---

## 4. Écrans et routes

| Route | Fichier | Description |
|---|---|---|
| `/onboarding` | `src/routes/_authenticated/onboarding.tsx` | Création initiale de boutique |
| `/dashboard/boutique` | `src/routes/_authenticated/dashboard.boutique.tsx` | Modification de la boutique |
| `/dashboard/reglages` | `src/routes/_authenticated/dashboard.reglages.tsx` | Réglages du compte et zone de danger |
| `/b/{slug}` | `src/routes/b.$slug.index.tsx` | Vitrine publique |

---

## 5. Données

### Tables utilisées

| Table | Opérations | Notes |
|---|---|---|
| `shops` | INSERT, SELECT, UPDATE | Une par commerçant |
| `product_categories` | SELECT | Catégories personnalisées |

### Colonnes importantes

- `slug` : unique, regex `^[a-z0-9][a-z0-9-]{1,40}[a-z0-9]$`, modifiable une seule fois
- `slug_changed` : booléen — verrou définitif
- `whatsapp` : format international `+XXXXXXXXXXX` obligatoire
- `theme` : savane, minuit, boutique, marche, pur, oasis
- `primary_color` : hexadécimal
- `currency` : USD ou CDF (pour les produits)
- `category` : catégorie prédéfinie
- `category_custom` : catégorie personnalisée (si category = "autre"), 3-40 caractères
- `is_published` : visible en public
- `is_suspended` : suspendu par l'admin (protégé par trigger)
- `account_status` : active ou suspended_for_deletion (protégé par trigger)

### RLS

- `anon` : SELECT (is_published = true, is_suspended = false, account_status = 'active')
- `authenticated` : CRUD (own) + admin all
- Trigger `shop_slug_guard()` : protège slug, is_suspended, account_status, views

---

## 6. Logique serveur

### Fonctions serveur

Pas de fichier dédié `shop.functions.ts`. Les opérations CRUD sont faites directement avec le client Supabase depuis les routes.

La fonction `slug_available()` est une fonction PostgreSQL :
```sql
-- Migration 20261012000000
SELECT public.slug_available('mon-slug');
-- Retourne true si disponible
```

---

## 7. E-mails et notifications

| Déclencheur | Destinataire | Fonction |
|---|---|---|
| Création de boutique | Commerçant | `sendMerchantWelcomeEmail()` dans `invoices.server.ts` |
| Création de boutique | Administrateur | `notifyMerchantWelcome()` dans `admin.functions.ts` |

---

## 8. Règles métier

- Un commerçant ne peut avoir qu'une seule boutique.
- Le slug ne peut être modifié qu'une seule fois (trigger bloque les modifications suivantes).
- L'admin peut forcer le changement de slug.
- La boutique est publiée (`is_published = true`) par défaut à la création.
- L'admin peut suspendre une boutique (`is_suspended = true`), la rendant invisible.
- En cas de demande de suppression de compte, `account_status` passe à `suspended_for_deletion` et la boutique est dépubliée.

---

## 9. Dépendances avec d'autres modules

- [Produits](produits.md) — les produits appartiennent à une boutique
- [Promotions](promotions.md) — les promotions appartiennent à une boutique
- [Abonnements](abonnements.md) — le plan détermine les limites de la boutique
- [Suppression de compte](suppression-compte.md) — suspend et dépublie la boutique
- [Administration](administration.md) — modération, suspension, inspection

---

## 10. Sécurité — ce qui est vérifié côté serveur

- Trigger `shop_slug_guard()` : vérifie que le slug n'a pas déjà été modifié
- Trigger `shop_plan_guard()` : empêche le commerçant de modifier `plan_id` et `plan_expires_at`
- Trigger `shop_slug_guard()` : empêche le commerçant de modifier `is_suspended` et `account_status`
- `is_active_user()` : seul un commerçant actif peut créer une boutique
- RLS : un commerçant ne peut modifier que sa propre boutique

---

## 11. Limites connues et points à vérifier

- Limite connue : un commerçant ne peut pas avoir plusieurs boutiques.
- À vérifier : comportement si le slug choisi existe déjà (validation côté client présente, mais vérifier le message d'erreur retourné par la contrainte unique PostgreSQL).
- Prévu mais non implémenté : domaine personnalisé et sous-domaine.

---

## 12. Fichiers source principaux

- `src/routes/_authenticated/onboarding.tsx`
- `src/routes/_authenticated/dashboard.boutique.tsx`
- `src/routes/_authenticated/dashboard.reglages.tsx`
- `src/components/dashboard/ShopFields.tsx`
- `src/components/dashboard/ShopPreview.tsx`
- `src/hooks/useMyShop.ts`
- `supabase/migrations/20261009000000_initial_schema.sql`
- `supabase/migrations/20261009000002_plans_admin.sql`
- `supabase/migrations/20261012000000_slug_available_function.sql`
- `supabase/migrations/20261017000001_shop_custom_category_and_broadcasts.sql`
- `supabase/migrations/20261020000000_account_deletion_workflow.sql`
