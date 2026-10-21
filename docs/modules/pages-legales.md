# Pages légales et conformité — Actif

> Dernière mise à jour : 2026-10-21
> Source : `src/routes/terms.tsx`, `src/routes/privacy.tsx`, `src/routes/data-deletion.tsx`

---

## 1. À quoi ça sert

Définit le cadre juridique, la politique de confidentialité et les mécanismes de protection des données personnelles de la plateforme MarketNet, indispensables pour la conformité légale, la confiance des utilisateurs et les prérequis d'approbation des plateformes partenaires (notamment WhatsApp / Meta et SasPay).

---

## 2. Qui l'utilise

- [x] Commerçant (consultation lors de l'inscription et dans le pied de page)
- [x] Administrateur (garantie de conformité juridique)
- [x] Client final (accès depuis le pied de page de la vitrine et du site public)

---

## 3. Liste des pages légales

| Route | Fichier | Description |
|---|---|---|
| `/terms` | `src/routes/terms.tsx` | Conditions Générales d'Utilisation (CGU) régissant l'usage de MarketNet, les engagements du commerçant, l'absence de commission sur les ventes et la responsabilité relative aux échanges WhatsApp. |
| `/privacy` | `src/routes/privacy.tsx` | Politique de confidentialité détaillant les types de données collectées, l'hébergement, la non-revente des informations et les droits d'accès/rectification. |
| `/data-deletion` | `src/routes/data-deletion.tsx` | Page d'instructions explicite sur la suppression des données (exigée par les politiques développeurs de Meta / Facebook), décrivant la procédure pas à pas et le délai de 30 jours. |

---

## 4. Données et conformité

- **Nature des données traitées** : Identité du commerçant (nom, email, numéro WhatsApp), données du catalogue (produits, photos, descriptions), et historique technique des commandes transmises.
- **Paiements** : MarketNet ne stocke aucune coordonnée bancaire ni code secret Mobile Money ; l'intégralité du traitement monétaire est déléguée à SasPay.
- **Droit à l'effacement** : Implémenté concrètement par le module de suppression de compte accessible directement dans `/dashboard/reglages`.

---

## 5. Règles éditoriales

- Rédigées en français clair et compréhensible.
- Adaptées au contexte économique et juridique de la République Démocratique du Congo.
- Liens accessibles en permanence depuis le pied de page de la page d'accueil, le formulaire d'inscription `/auth`, et le pied de page des vitrines de boutique.

---

## 6. Fichiers source principaux

- `src/routes/terms.tsx`
- `src/routes/privacy.tsx`
- `src/routes/data-deletion.tsx`
