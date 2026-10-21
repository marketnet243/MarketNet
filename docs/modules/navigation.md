# Navigation et arborescence des routes — Actif

> Dernière mise à jour : 2026-10-21
> Source : `src/routes/`, `src/routes/_authenticated/dashboard.tsx`, `src/routes/_authenticated/admin.tsx`

---

## 1. À quoi ça sert

Cartographie l'intégralité du routage de l'application géré par **TanStack Router**, définissant les layouts partagés, les gardes d'authentification (`_authenticated`), les barres latérales (sidebars) et les flux de redirection selon les rôles.

---

## 2. Structure globale des routes

```
/ (Accueil marketing public)
├── /auth (Connexion et inscription)
├── /reset-password (Réinitialisation mot de passe)
├── /terms (CGU)
├── /privacy (Confidentialité)
├── /data-deletion (Guide suppression)
│
├── /b/{slug} (Storefront public de la boutique)
│   ├── /p/{productId} (Page produit détaillée)
│   └── /promo/{promoId} (Page promotion dédiée)
│
├── /abonnement/retour (Retour après paiement SasPay)
│
├── _authenticated/ (Zone protégée par session Supabase)
│   ├── /onboarding (Création guidée de la boutique)
│   │
│   ├── /dashboard/ (Layout commerçant avec Sidebar)
│   │   ├── / (Statistiques et indicateurs)
│   │   ├── /boutique (Personnalisation de la vitrine)
│   │   ├── /produits (Gestion du catalogue)
│   │   ├── /promotions (Campagnes visuelles)
│   │   ├── /commandes (Historique des commandes WhatsApp)
│   │   ├── /abonnement (Forfaits, cycle CDF, paiement)
│   │   ├── /support (Tickets d'aide)
│   │   └── /reglages (Profil, notifications, zone de danger)
│   │
│   └── /admin/ (Layout administrateur avec Sidebar dédiée)
│       ├── / (KPIs globaux et revenus CDF)
│       ├── /commercants (Utilisateurs et statuts)
│       ├── /boutiques (Annuaire et modération)
│       ├── /plans (Grille tarifaire et quotas)
│       ├── /paiements (Transactions SasPay et attributions)
│       ├── /support (Tickets et diffusions globales)
│       └── /demandes-suppression (Supervision des purges à 30 jours)
│
└── api/ (Endpoints HTTP publics ou sécurisés par token)
    ├── /public/webhook-saspay (Notification paiement)
    ├── /public/invoice-pdf (Téléchargement facture PDF)
    ├── /public/broadcast-track (Pixel de tracking e-mail)
    ├── /public/media/* (Proxy média privé)
    └── /cron/ (Endpoints appelés par planificateurs avec CRON_SECRET)
        ├── /process-account-deletions
        └── /subscription-reminders
```

---

## 3. Menus de navigation (Sidebars)

### Barre latérale Commerçant (`/dashboard/*`)
- **Tableau de bord** (`/dashboard`) : Icône LayoutDashboard
- **Ma Boutique** (`/dashboard/boutique`) : Icône Store
- **Produits** (`/dashboard/produits`) : Icône Package
- **Promotions** (`/dashboard/promotions`) : Icône Sparkles / Tag
- **Commandes** (`/dashboard/commandes`) : Icône ShoppingBag
- **Abonnement** (`/dashboard/abonnement`) : Icône CreditCard (avec badge du plan actuel)
- **Assistance** (`/dashboard/support`) : Icône HelpCircle / MessageSquare
- **Réglages** (`/dashboard/reglages`) : Icône Settings

Pied de sidebar : lien direct vers « Voir ma vitrine en direct » (`/b/{slug}`) s'ouvrant dans un nouvel onglet, et bouton de déconnexion.

### Barre latérale Administrateur (`/admin/*`)
- **Vue d'ensemble** (`/admin`) : Métriques consolidées
- **Commerçants** (`/admin/commercants`) : Gestion des comptes
- **Boutiques** (`/admin/boutiques`) : Modération et inspection
- **Plans & Tarifs** (`/admin/plans`) : Gestion des offres CDF
- **Paiements** (`/admin/paiements`) : Rapprochement bancaire et attributions
- **Support & Diffusions** (`/admin/support`) : Assistance et messages généraux
- **Demandes de suppression** (`/admin/demandes-suppression`) : Traitement des purges

---

## 4. Règles de routage et redirections

- Un utilisateur non connecté tentant d'accéder à `/dashboard/*` ou `/admin/*` est redirigé vers `/auth`.
- Un commerçant connecté tentant d'accéder à `/admin/*` est redirigé vers `/dashboard`.
- Un utilisateur connecté sans boutique est automatiquement dirigé vers `/onboarding`.
- La page racine `/` affiche la présentation produit de MarketNet si l'internaute n'est pas connecté, ou propose un accès rapide vers son tableau de bord s'il a une session active.

---

## 5. Fichiers source principaux

- `src/router.tsx`
- `src/routes/_authenticated/dashboard.tsx`
- `src/routes/_authenticated/admin.tsx`
- `src/components/ui/sidebar.tsx`
