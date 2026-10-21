# Promotions — Actif

> Dernière mise à jour : 2026-10-21
> Source : `src/routes/_authenticated/dashboard.promotions.tsx`, `src/components/promo/`, `supabase/migrations/20261009000004_promotions_module.sql`

---

## 1. À quoi ça sert

Permet aux commerçants de créer des campagnes promotionnelles visuelles (ventes flash, offres spéciales) affichées sous forme de bannières sur leur vitrine. Cinq modèles graphiques modernes sont disponibles. Les promotions peuvent inclure des produits sélectionnés, des réductions, des dates de validité et un compte à rebours.

---

## 2. Qui l'utilise

- [x] Commerçant (création et gestion)
- [x] Administrateur (modération, masquage)
- [x] Client final (affichage carrousel sur la vitrine)

---

## 3. Parcours utilisateur

```
Commerçant :
1. /dashboard/promotions
   └── Liste des promotions (brouillon, publiée, en pause)
   └── Bouton "Nouvelle promotion"
   └── Formulaire : titre, étiquette, description, template, image,
       réduction (% ou montant fixe), dates début/fin, bouton d'action,
       sélection de produits (max 24), lien WhatsApp direct optionnel
   └── Prévisualisation temps réel du template choisi
   └── Publication → vérification quotas par trigger PostgreSQL

Client final :
1. /b/{slug}
   └── Carrousel automatique des promotions publiées et actives
   └── Hauteur 190px mobile, 260px desktop
   └── Clic sur une promotion → /b/{slug}/promo/{promoId}
2. /b/{slug}/promo/{promoId}
   └── Page dédiée : affiche promotion complète avec produits associés
   └── Bouton WhatsApp ou panier selon configuration
```

---

## 4. Écrans et routes

| Route | Fichier | Description |
|---|---|---|
| `/dashboard/promotions` | `src/routes/_authenticated/dashboard.promotions.tsx` | Gestion des promotions |
| `/b/{slug}` | `src/routes/b.$slug.index.tsx` | Carrousel sur la vitrine |
| `/b/{slug}/promo/{promoId}` | `src/routes/b.$slug.promo.$promoId.tsx` | Page promotion dédiée |

---

## 5. Données

### Tables utilisées

| Table | Opérations | Notes |
|---|---|---|
| `promotions` | CRUD | Limitée par plan |
| `promotion_products` | CRUD | Max 24 produits par promotion |
| `promotion_events` | INSERT | Tracking anonyme ou authentifié |

### Colonnes importantes (`promotions`)

- `template` : fullscreen, split, badge, minimal, countdown
- `discount_type` : percent ou amount (nullable si pas de réduction affichée)
- `discount_value` : valeur de la réduction (max 95% si type percent)
- `status` : draft (brouillon), published (publiée), paused (en pause)
- `is_hidden` : masquée par l'admin — protégé contre modification par le commerçant
- `image_url` : obligatoire sauf pour le template `minimal`
- `starts_at` / `ends_at` : dates de validité (peuvent être nulles = sans limite)
- `button_label` : texte du bouton d'action (1-30 caractères)

### Colonnes (`promotion_events`)

- `kind` : view, click, share, whatsapp, order

---

## 6. Logique serveur

### Triggers de base de données

- `promotions_guard` (BEFORE INSERT/UPDATE) : appelle `promotion_guard()`
  - Vérifie que le template est autorisé par le plan du commerçant
  - Vérifie que le quota de promotions actives n'est pas dépassé
  - Protège `is_hidden` contre modification par le commerçant
  - Protège `shop_id` contre modification
- `promotion_products_guard` (BEFORE INSERT/UPDATE) : vérifie que le produit appartient bien à la boutique de la promotion et que le max de 24 produits n'est pas atteint

### Fonctions utilitaires

- `is_promotion_public(_promo_id)` : vérifie qu'une promotion est publiée, non masquée, dans ses dates de validité, et que la boutique est publique
- `is_promotion_owner(_promo_id)` : vérifie que l'utilisateur courant est propriétaire de la boutique de la promotion

### Côté client

- `src/lib/promotions.ts` : fonctions utilitaires pour afficher les promotions

---

## 7. Règles métier

### Limites par plan

| Plan | Promotions actives | Templates autorisés |
|---|---|---|
| Gratuit | 1 | fullscreen, split, minimal |
| Pro | 5 | Tous (fullscreen, split, badge, minimal, countdown) |
| Business | Illimité | Tous |

### Validation des promotions

- La réduction en pourcentage est limitée à 95% maximum (contrainte PostgreSQL)
- `ends_at` doit être postérieure à `starts_at` si les deux sont définies
- Le template `minimal` est le seul à ne pas nécessiter d'image

---

## 8. Dépendances avec d'autres modules

- [Boutiques](boutiques.md) — chaque promotion appartient à une boutique
- [Produits](produits.md) — les promotions peuvent inclure des produits
- [Abonnements](abonnements.md) — le plan détermine les quotas et templates disponibles
- [Panier et commande](panier-commande.md) — les promotions peuvent déclencher une commande WhatsApp

---

## 9. Sécurité — ce qui est vérifié côté serveur

- Trigger `promotion_guard()` : toutes les vérifications de quota et de template sont côté base de données, inaccessibles au client
- `is_hidden` : seul l'admin peut masquer une promotion, même via une requête API directe
- RLS : un commerçant ne peut voir et modifier que ses propres promotions

---

## 10. Limites connues et points à vérifier

- À vérifier : le template `countdown` affiche un compte à rebours basé sur `ends_at`. Si `ends_at` est null, comportement à vérifier.
- Limite connue : max 24 produits par promotion (contrainte base de données).
- À vérifier : la suppression d'une promotion — est-elle possible côté commerçant ou seulement admin ?

---

## 11. Fichiers source principaux

- `src/routes/_authenticated/dashboard.promotions.tsx`
- `src/routes/b.$slug.promo.$promoId.tsx`
- `src/components/promo/PromoBanner.tsx`
- `src/components/promo/PromoSlide.tsx`
- `src/lib/promotions.ts`
- `supabase/migrations/20261009000004_promotions_module.sql`
- `supabase/migrations/20261009000005_promotion_badge_label.sql`
