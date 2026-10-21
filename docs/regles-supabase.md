# Règles Supabase — GRANT et RLS

> Dernière mise à jour : 2026-10-21
> Source : `supabase/migrations/`

---

## Contexte critique (à lire avant toute migration)

À partir du **30 octobre 2026**, Supabase n'accorde plus automatiquement l'accès à l'API de données (`supabase-js`, PostgREST, GraphQL) aux **nouvelles tables** du schéma `public` des projets existants.

- Les tables existantes gardent leurs droits actuels.
- Sans `GRANT` explicite, l'API renvoie `permission denied`.
- Cela affecte aussi : les nouveaux projets, les branches de prévisualisation, `supabase db reset` en local.

---

## Règle 1 — Toujours dans la même migration

Toute migration qui crée une table dans `public` doit contenir, **dans la même migration** :
1. Le `GRANT` adapté
2. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
3. Les politiques RLS

Ne jamais créer une table dans une migration et ajouter le GRANT dans une autre.

---

## Règle 2 — Modèle de migration complet

```sql
-- 1. Créer la table
CREATE TABLE IF NOT EXISTS public.ma_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... colonnes
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. GRANT adapté au besoin réel
-- Seulement si des visiteurs non connectés doivent lire cette table :
GRANT SELECT ON public.ma_table TO anon;

-- Pour les utilisateurs connectés (adapter selon les opérations permises) :
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ma_table TO authenticated;

-- Toujours pour les fonctions serveur :
GRANT ALL ON public.ma_table TO service_role;

-- 3. Activer la RLS
ALTER TABLE public.ma_table ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS
CREATE POLICY "..." ON public.ma_table
  FOR SELECT TO authenticated
  USING (...);
```

---

## Règle 3 — GRANT ≠ RLS

- Le **GRANT** donne l'accès à la table (niveau PostgreSQL).
- La **RLS** limite les lignes visibles (niveau application).
- Les deux sont obligatoires.
- **Ne jamais désactiver la RLS** pour faire fonctionner quelque chose. Si ça ne marche pas, c'est que le GRANT ou la politique est incorrecte.

---

## Règle 4 — Qui peut avoir accès à `anon` ?

`anon` uniquement sur les tables **réellement publiques** :

| Table | anon | Justification |
|---|---|---|
| `shops` | SELECT | Vitrine publique |
| `products` | SELECT | Catalogue public |
| `product_categories` | SELECT | Filtres publics |
| `promotions` | SELECT | Carrousel public |
| `promotion_products` | SELECT | Produits en promotion |
| `promotion_events` | INSERT | Tracking anonyme |
| `orders` | INSERT | Commande WhatsApp sans compte |
| `shop_reports` | INSERT | Signalement anonyme |
| `plans` | SELECT | Grille tarifaire publique |
| `plan_prices` | SELECT | Tarifs publics |
| `app_settings` | SELECT | Paramètres publics |

**Jamais `anon` sur** : `subscription_payments`, `merchant_subscriptions`, `payment_events`, `support_tickets`, `support_messages`, `support_attachments`, `support_broadcasts`, `support_broadcast_recipients`, `account_deletion_requests`, `account_deletion_audit`, `notification_outbox`, `subscription_reminder_log`, `audit_log`, `user_roles`, `profiles`.

---

## Règle 5 — N'accorder que les opérations nécessaires

Exemples :
- `orders` pour `authenticated` : SELECT, INSERT, UPDATE (pas DELETE — les commerçants ne suppriment pas les commandes)
- `support_tickets` pour `authenticated` : SELECT, INSERT, UPDATE (pas DELETE)
- `audit_log` pour `authenticated` : SELECT, INSERT (pas UPDATE ni DELETE — journal immuable)

---

## Règle 6 — Séquences et fonctions

Si la table utilise une séquence (`SERIAL`, `BIGSERIAL`, ou `nextval`), ajouter :
```sql
GRANT USAGE, SELECT ON SEQUENCE public.ma_sequence TO authenticated;
GRANT ALL ON SEQUENCE public.ma_sequence TO service_role;
```

Exemple réel dans le projet : `support_ticket_number_seq` (migration `20261015000001`).

Si des fonctions PL/pgSQL sont utilisées par la table ou en lien avec elle :
```sql
GRANT EXECUTE ON FUNCTION public.ma_fonction() TO authenticated;
-- ou
REVOKE ALL ON FUNCTION public.ma_fonction() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ma_fonction() TO service_role;
```

---

## Règle 7 — Migrations réexécutables

Utiliser `IF NOT EXISTS`, `DROP POLICY IF EXISTS ... / CREATE POLICY ...`, `ON CONFLICT DO UPDATE/NOTHING` pour que les migrations puissent être rejouées sans erreur (ex. après `supabase db reset`).

---

## Règle 8 — Après une erreur `permission denied`

Ne pas exécuter aveuglément la commande suggérée. Décider d'abord :
1. Quel rôle doit réellement accéder à cette table ?
2. Quelles opérations (SELECT seulement ? INSERT aussi ?)
3. La RLS est-elle correctement définie ?

Puis ajouter le GRANT dans la migration appropriée (nouvelle migration additive).

---

## Règle 9 — Tester avec 4 profils

Avant de considérer une migration comme terminée :
1. **Visiteur non connecté** (`anon`) : peut-il accéder à ce qu'il doit voir ? Pas plus ?
2. **Commerçant connecté** (`authenticated`) : peut-il voir et modifier ses propres données ?
3. **Autre commerçant** : peut-il accéder aux données du premier ? (Doit être NON)
4. **Administrateur** : a-t-il accès à tout ce dont il a besoin ?

---

## Tableau des tables existantes (accès actuel observé)

> Source : migrations SQL. L'accès réel en production est À vérifier directement en base.

| Table | anon | authenticated | service_role | Notes |
|---|---|---|---|---|
| `profiles` | — | SELECT (own + admin), INSERT, UPDATE | ALL | — |
| `user_roles` | — | SELECT (own + admin) | ALL | Sensible |
| `shops` | SELECT (publiées) | CRUD (own + admin) | ALL | — |
| `product_categories` | SELECT (boutique publique) | CRUD | ALL | — |
| `products` | SELECT (actifs, boutique publique) | CRUD | ALL | — |
| `orders` | INSERT seulement | SELECT/INSERT/UPDATE | ALL | Pas de delete |
| `plans` | SELECT | SELECT + admin CRUD | ALL | — |
| `plan_prices` | SELECT | SELECT + admin CRUD | ALL | — |
| `subscription_payments` | — | SELECT (own + admin) + UPDATE (admin) | ALL | Sensible |
| `merchant_subscriptions` | — | SELECT (own + admin) | ALL | Sensible |
| `payment_events` | — | SELECT (admin) | ALL | Très sensible |
| `promotions` | SELECT (publiées) | CRUD | ALL | — |
| `promotion_products` | SELECT (promo publiée) | CRUD | ALL | — |
| `promotion_events` | INSERT | SELECT (owner) | ALL | — |
| `support_tickets` | — | SELECT/INSERT/UPDATE | ALL | Pas d'anon |
| `support_messages` | — | SELECT/INSERT/UPDATE | ALL | Notes internes admin seulement |
| `support_attachments` | — | SELECT/INSERT | ALL | — |
| `notification_outbox` | — | SELECT (admin) | ALL | Très sensible |
| `subscription_reminder_log` | — | SELECT (admin) | ALL | Sensible |
| `support_broadcasts` | — | CRUD (admin) + SELECT (destinataires) | ALL | — |
| `support_broadcast_recipients` | — | SELECT/UPDATE (own + admin) | ALL | — |
| `account_deletion_requests` | — | SELECT/INSERT/UPDATE | ALL | Sensible |
| `account_deletion_audit` | — | SELECT (admin) | ALL | Très sensible |
| `app_settings` | SELECT | SELECT + admin CRUD | ALL | — |
| `audit_log` | — | SELECT/INSERT (admin) | ALL | Sensible |
| `shop_reports` | INSERT | SELECT/UPDATE (admin) | ALL | — |

> **Risque identifié** : `plans` et `plan_prices` accordent `INSERT, UPDATE, DELETE` à `authenticated`. La politique RLS `plans admin` restreint ces opérations aux admins, mais le GRANT est plus permissif que nécessaire. À surveiller.
