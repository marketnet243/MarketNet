# Produits et images — Actif

> Dernière mise à jour : 2026-10-21
> Source : `src/routes/_authenticated/dashboard.produits.tsx`, `supabase/migrations/20261009000000_initial_schema.sql`

---

## 1. À quoi ça sert

Gère le catalogue de produits d'une boutique : création, modification, suppression, statut (actif/masqué/rupture), mise en avant, catégorisation et gestion des images (Cloudinary) et des variantes simples.

---

## 2. Qui l'utilise

- [x] Commerçant (gestion de son catalogue)
- [x] Administrateur (inspection des catalogues)
- [x] Client final (consultation de la vitrine publique)

---

## 3. Parcours utilisateur

```
Commerçant :
1. /dashboard/produits
   └── Liste de ses produits avec statut, prix, photos
   └── Bouton "Ajouter un produit"
   └── Formulaire : nom, description, prix, devise, catégorie, stock,
       photos (upload Cloudinary), variantes, statut, mise en avant

2. Upload d'images
   └── cloudinaryUploadSignature() → signature serveur
   └── Upload direct vers Cloudinary (WebP automatique)
   └── URL Cloudinary stockée dans products.images[]

Client final :
1. /b/{slug}
   └── Grille de produits (status != 'hidden', boutique publique)
   └── Filtre par catégorie et recherche temps réel
2. /b/{slug}/p/{productId}
   └── Détail produit : galerie, prix, description, variantes
   └── Bouton "Ajouter au panier"
```

---

## 4. Écrans et routes

| Route | Fichier | Description |
|---|---|---|
| `/dashboard/produits` | `src/routes/_authenticated/dashboard.produits.tsx` | Gestion du catalogue |
| `/b/{slug}` | `src/routes/b.$slug.index.tsx` | Vitrine publique (grille) |
| `/b/{slug}/p/{productId}` | `src/routes/b.$slug.p.$productId.tsx` | Page produit détaillée |

---

## 5. Données

### Tables utilisées

| Table | Opérations | Notes |
|---|---|---|
| `products` | CRUD | Limité par plan |
| `product_categories` | SELECT, INSERT, UPDATE, DELETE | Catégories de la boutique |

### Colonnes importantes (`products`)

- `images` : tableau d'URLs (Cloudinary ou proxy Supabase) — max selon plan
- `variants` : JSONB, tableau de `{name: string, values: string[]}` — facultatif
- `status` : `active`, `hidden`, `out_of_stock`
- `featured` : booléen — mis en avant sur la vitrine
- `price` : numeric(12,2), doit être >= 0 (contrainte : doit être > 0 depuis migration `20261017000002`)
- `currency` : USD ou CDF (distinct de la devise d'abonnement)
- `category_id` : référence vers `product_categories.id` (nullable)

### RLS

- `anon` : SELECT (status != 'hidden', boutique publique)
- `authenticated` : CRUD (is_shop_owner)

---

## 6. Logique serveur

### Fonctions serveur

- `cloudinaryUploadSignature()` dans `src/lib/cloudinary.functions.ts` : génère une signature serveur pour l'upload direct vers Cloudinary

### Triggers de base de données

- `products_limit` (trigger BEFORE INSERT/UPDATE) : appelle `product_limit_guard()`
  - Vérifie que le nombre de produits ne dépasse pas `plans.max_products`
  - Vérifie que `images[]` ne dépasse pas `plans.max_photos`

---

## 7. Règles métier

### Limites par plan

| Plan | Max produits | Max photos par produit |
|---|---|---|
| Gratuit | 10 | 3 |
| Pro | 200 | 6 |
| Business | Illimité | 6 |

> Note : ces valeurs sont définies dans la table `plans` et peuvent être modifiées par l'admin. Vérifier en base pour les valeurs actuelles.

### Comportement à l'expiration du plan

Quand un commerçant Pro ou Business passe au plan Gratuit (expiration sans renouvellement) :
- Les produits dépassant le quota gratuit (10) sont **temporairement masqués** (`status = 'hidden'`) sur la vitrine, mais **non supprimés**.
- Dès renouvellement, ils sont automatiquement réactivés.

> À vérifier : la logique de masquage automatique est référencée dans `src/lib/subscriptions.ts` (`identifyExcessItemsToPause`) et la `src/lib/subscriptions.functions.ts`. Vérifier si elle est bien appliquée lors des tâches cron.

### Variantes

Les variantes sont stockées en JSONB et sont optionnelles. Structure attendue :
```json
[{"name": "Taille", "values": ["S", "M", "L"]}, {"name": "Couleur", "values": ["Rouge", "Bleu"]}]
```

---

## 8. Dépendances avec d'autres modules

- [Boutiques](boutiques.md) — chaque produit appartient à une boutique
- [Promotions](promotions.md) — les produits peuvent être associés à des promotions
- [Panier et commande](panier-commande.md) — les produits sont ajoutés au panier
- [Abonnements](abonnements.md) — le plan détermine les quotas

---

## 9. Sécurité — ce qui est vérifié côté serveur

- Trigger `product_limit_guard()` : vérifie les quotas avant toute création ou modification
- Upload Cloudinary : signature générée côté serveur, l'upload direct ne bypasse pas la validation
- RLS : un commerçant ne peut créer/modifier que les produits de sa boutique

---

## 10. Limites connues et points à vérifier

- À vérifier : le masquage automatique des produits excédentaires lors du passage au plan Gratuit — est-il déclenché par le cron ou au moment du paiement ?
- Limite connue : les variantes n'ont pas de logique de stock par variante (stock global uniquement).
- À vérifier : migration `20261017000002` ajoute une contrainte `price > 0` — les produits gratuits (prix = 0) sont-ils supportés ?

---

## 11. Fichiers source principaux

- `src/routes/_authenticated/dashboard.produits.tsx`
- `src/routes/b.$slug.index.tsx`
- `src/routes/b.$slug.p.$productId.tsx`
- `src/lib/cloudinary.functions.ts`
- `src/lib/cloudinary.server.ts`
- `src/lib/upload.ts`
- `src/components/store/StoreParts.tsx`
- `supabase/migrations/20261009000000_initial_schema.sql`
- `supabase/migrations/20261009000002_plans_admin.sql`
- `supabase/migrations/20261017000002_product_price_strictly_positive.sql`
