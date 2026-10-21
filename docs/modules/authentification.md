# Authentification — Actif

> Dernière mise à jour : 2026-10-21
> Source : `src/routes/auth.tsx`, `src/routes/reset-password.tsx`, `src/integrations/supabase/`

---

## 1. À quoi ça sert

Gère l'inscription des commerçants, la connexion, la récupération de mot de passe et la déconnexion. Utilise Supabase Auth comme fournisseur d'identité. À la création du compte, un profil et un rôle `merchant` sont automatiquement attribués par trigger.

---

## 2. Qui l'utilise

- [x] Commerçant (inscription et connexion)
- [x] Administrateur (connexion — compte créé via script)
- [ ] Client final

---

## 3. Parcours utilisateur

```
Inscription :
1. /auth (onglet Inscription)
   └── Nom complet, email, mot de passe
   └── Liens vers CGU et Politique de confidentialité
   └── supabase.auth.signUp()
   └── Trigger handle_new_user() : crée profiles + user_roles(merchant)
   └── Email de confirmation envoyé (template email-templates/confirmation.html)
   └── Redirection vers /dashboard

Connexion :
1. /auth (onglet Connexion)
   └── Email + mot de passe
   └── supabase.auth.signInWithPassword()
   └── Vérification du rôle : admin → /admin, merchant → /dashboard

Réinitialisation mot de passe :
1. /auth → "Mot de passe oublié"
   └── supabase.auth.resetPasswordForEmail()
   └── Email envoyé (template email-templates/reset-password.html)
2. /reset-password (lien depuis l'email)
   └── Nouveau mot de passe + confirmation
   └── supabase.auth.updateUser()
```

---

## 4. Écrans et routes

| Route | Fichier | Description |
|---|---|---|
| `/auth` | `src/routes/auth.tsx` | Inscription + connexion (2 onglets) |
| `/reset-password` | `src/routes/reset-password.tsx` | Saisie du nouveau mot de passe |

---

## 5. Données

### Tables utilisées

| Table | Opérations | Notes |
|---|---|---|
| `profiles` | INSERT (trigger), SELECT, UPDATE | Créé automatiquement |
| `user_roles` | INSERT (trigger), SELECT | `merchant` ou `admin` |
| `auth.users` | Géré par Supabase | Email, password, métadonnées |

### Colonnes importantes (`profiles`)
- `status` : `active` (défaut) ou `suspended_for_deletion` — protégé par trigger `profiles_guard`
- `account_status` : `active` ou `suspended_for_deletion` (ajouté en `20261020000000`)

---

## 6. Logique serveur

Pas de fonctions serveur dédiées pour l'auth (géré directement par Supabase Auth SDK côté client).

### Middleware d'authentification
- `src/integrations/supabase/auth-middleware.ts` : `requireSupabaseAuth` utilisé sur toutes les fonctions serveur protégées

### Hooks
- `src/hooks/useAuth.tsx` : état de session courante
- `src/hooks/useIsAdmin.ts` : vérifie si l'utilisateur a le rôle admin
- `src/hooks/useMyShop.ts` : boutique du commerçant connecté

---

## 7. E-mails et notifications

| Déclencheur | Destinataire | Template |
|---|---|---|
| Inscription | Commerçant | `email-templates/confirmation.html` (Supabase Auth) |
| Réinitialisation mot de passe | Commerçant | `email-templates/reset-password.html` (Supabase Auth) |
| Nouvelle inscription (alerte admin) | Administrateur | `sendNewUserAdminNotification()` dans `invoices.server.ts` |

---

## 8. Règles métier

- Seul le rôle `merchant` est attribué automatiquement à l'inscription.
- Le rôle `admin` est attribué manuellement via `scripts/create-admin.mjs`.
- Un profil en statut `suspended_for_deletion` ne peut plus créer de boutique ni se connecter normalement.
- La confirmation d'e-mail est gérée par Supabase ; les templates sont dans `email-templates/`.

---

## 9. Dépendances avec d'autres modules

- [Boutiques](boutiques.md) — création de boutique après inscription
- [Administration](administration.md) — le rôle admin est vérifié à la connexion pour la redirection
- [Suppression de compte](suppression-compte.md) — suspend le profil

---

## 10. Sécurité — ce qui est vérifié côté serveur

- RLS sur `profiles` : un utilisateur ne peut modifier que son propre profil
- Trigger `profiles_guard` : protège le champ `status` contre modification par le commerçant
- `is_active_user()` : vérifie que le profil est actif avant de permettre la création de boutique

---

## 11. Limites connues et points à vérifier

- À vérifier : comportement si un utilisateur tente de se connecter avec un compte `suspended_for_deletion`
- Limite connue : pas d'OAuth (Google, Facebook) — email/mot de passe uniquement

---

## 12. Fichiers source principaux

- `src/routes/auth.tsx`
- `src/routes/reset-password.tsx`
- `src/integrations/supabase/auth-middleware.ts`
- `src/hooks/useAuth.tsx`
- `src/hooks/useIsAdmin.ts`
- `email-templates/confirmation.html`
- `email-templates/reset-password.html`
- `supabase/migrations/20261009000000_initial_schema.sql` (trigger `handle_new_user`)
- `supabase/migrations/20261009000002_plans_admin.sql` (trigger `profiles_guard`)
