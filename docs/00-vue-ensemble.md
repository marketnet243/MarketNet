# 00 — Vue d'ensemble de MarketNet

> Dernière mise à jour : 2026-10-21
> Source : analyse du code — `README.md`, `src/routes/`

---

## Ce qu'est MarketNet

MarketNet est une plateforme SaaS e-commerce **multi-tenant** destinée aux commerçants de la République Démocratique du Congo (RDC) et d'Afrique francophone.

Elle permet à un vendeur de :
- Créer sa boutique en ligne en quelques minutes
- Publier son catalogue de produits avec photos
- Lancer des campagnes promotionnelles visuelles
- Recevoir ses commandes directement sur **WhatsApp** (sans commission)
- Gérer son abonnement et ses paiements en **Franc Congolais (FC)**

L'interface est conçue **mobile-first** pour les connexions mobiles réduites.

---

## Les deux rôles

| Rôle | Description | Accès |
|---|---|---|
| **Commerçant** | S'inscrit, crée et gère sa boutique | `/dashboard/*` et `/b/{slug}` (sa boutique) |
| **Administrateur** | Supervise toute la plateforme MarketNet | `/admin/*` |

> Les clients finaux **n'ont pas de compte**. Ils consultent la boutique publique et commandent via WhatsApp.

---

## Parcours commerçant (principal)

```
1. Inscription (/auth)
   └── Saisie : nom, email, mot de passe
   └── Création automatique du profil et du rôle "merchant"

2. Création de boutique (/onboarding)
   └── Nom, slug, catégorie, logo, bannière, WhatsApp, ville, heures

3. Tableau de bord (/dashboard)
   ├── Ajouter/modifier des produits
   ├── Créer des promotions
   ├── Voir les commandes reçues
   ├── Gérer l'abonnement et payer
   └── Accéder au support

4. Boutique publique (/b/{slug})
   └── Visible par tous sans connexion
```

---

## Parcours client final (sans compte)

```
1. Accès à la boutique publique : /b/{slug}
   └── Affichage : bannière, produits, promotions, catégories

2. Sélection de produits
   └── Ajout au panier local (sans connexion)

3. Commande WhatsApp
   └── Clic sur "Commander sur WhatsApp"
   └── Ouverture de wa.me/{numero}?text=... avec message pré-rempli
   └── Enregistrement automatique de la commande en base
```

---

## Parcours administrateur (principal)

```
1. Connexion (/auth) avec compte admin
   └── Redirection automatique vers /admin

2. Tableau de bord admin (/admin)
   └── Statistiques globales, revenus CDF, commerçants actifs

3. Gestion
   ├── Commerçants (/admin/commercants) — validation, suspension, suppression
   ├── Boutiques (/admin/boutiques) — modération
   ├── Plans (/admin/plans) — tarifs et limites
   ├── Paiements (/admin/paiements) — SasPay + attributions manuelles
   ├── Support (/admin/support) — tickets + diffusions
   └── Demandes suppression (/admin/demandes-suppression)
```

---

## URLs importantes

| URL | Description |
|---|---|
| `/` | Page d'accueil marketing de la plateforme |
| `/auth` | Inscription et connexion |
| `/b/{slug}` | Boutique publique d'un commerçant |
| `/b/{slug}/p/{productId}` | Page produit |
| `/b/{slug}/promo/{promoId}` | Page promotion |
| `/dashboard` | Tableau de bord commerçant |
| `/admin` | Espace administrateur |
| `/terms` | Conditions générales d'utilisation |
| `/privacy` | Politique de confidentialité |
| `/data-deletion` | Guide suppression des données |
| `/reset-password` | Réinitialisation de mot de passe |
| `/onboarding` | Écran de bienvenue post-création de boutique |
| `/abonnement/retour` | Retour depuis SasPay après paiement |

---

## Devise et localisation

- **Tarification des abonnements** : exclusivement en Franc Congolais (FC / CDF)
- **Produits** : USD ou CDF selon le choix du commerçant par boutique
- **Langue de l'interface** : français intégral, sans emojis
- **Fuseau horaire e-mails** : `Africa/Kinshasa`
