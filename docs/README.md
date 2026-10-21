# Documentation MarketNet

> Dernière mise à jour : 2026-10-21
> Source : analyse du code

Bienvenue dans la documentation de **MarketNet**, plateforme SaaS e-commerce WhatsApp pour les commerçants de RDC.

---

## Comment garder cette documentation à jour

1. **Après chaque tâche** : ajouter une entrée dans `journal-des-travaux.md` (modèle en haut du fichier).
2. **Si tu modifies un module** : mettre à jour son fichier dans `docs/modules/`.
3. **Si tu crées une table** : mettre à jour `02-base-de-donnees.md` et `regles-supabase.md`.
4. **Si tu ajoutes un terme** : mettre à jour `glossaire.md`.
5. **Si tu découvres un risque** : l'ajouter à `points-attention.md`.

---

## Sommaire

### Règles et protocoles

| Fichier | Contenu |
|---|---|
| [AGENTS.md](AGENTS.md) | Règles obligatoires pour tout agent — **lire en premier** |
| [journal-des-travaux.md](journal-des-travaux.md) | Journal horodaté de toutes les interventions |
| [regles-supabase.md](regles-supabase.md) | GRANT et RLS obligatoires pour toute nouvelle table |

### Vue d'ensemble

| Fichier | Contenu |
|---|---|
| [00-vue-ensemble.md](00-vue-ensemble.md) | Ce qu'est MarketNet, les deux rôles, les parcours principaux |
| [01-architecture.md](01-architecture.md) | Pile technique, diagramme, multi-boutiques, hébergement |
| [02-base-de-donnees.md](02-base-de-donnees.md) | Tables par domaine, relations, colonnes clés, RLS résumée |
| [03-securite-et-roles.md](03-securite-et-roles.md) | Authentification, rôles, vérifications serveur, secrets |
| [04-deploiement.md](04-deploiement.md) | Build, migrations, variables d'environnement, points fragiles |
| [design-system.md](design-system.md) | Couleurs, polices, composants, thèmes de boutique |

### Modules

| Fichier | Module | État |
|---|---|---|
| [modules/authentification.md](modules/authentification.md) | Inscription, connexion, réinitialisation | Actif |
| [modules/boutiques.md](modules/boutiques.md) | Création et réglages de boutique | Actif |
| [modules/produits.md](modules/produits.md) | Catalogue, images, variantes, catégories | Actif |
| [modules/promotions.md](modules/promotions.md) | Ventes flash, 5 modèles graphiques | Actif |
| [modules/panier-commande.md](modules/panier-commande.md) | Panier client et commande WhatsApp | Actif |
| [modules/abonnements.md](modules/abonnements.md) | Plans, périodes, grâce, rétrogradation | Actif |
| [modules/paiements-saspay.md](modules/paiements-saspay.md) | Intégration SasPay, webhook, réconciliation | Actif |
| [modules/factures-emails.md](modules/factures-emails.md) | PDF, e-mails transactionnels (Nodemailer) | Actif |
| [modules/support-tickets.md](modules/support-tickets.md) | Tickets d'assistance commerçant ↔ admin | Actif |
| [modules/diffusion.md](modules/diffusion.md) | Annonces admin vers commerçants | Actif |
| [modules/suppression-compte.md](modules/suppression-compte.md) | Workflow suppression 30 jours | Actif |
| [modules/administration.md](modules/administration.md) | Espace admin global | Actif |
| [modules/taches-planifiees.md](modules/taches-planifiees.md) | Crons : rappels et suppressions | Actif |
| [modules/pages-legales.md](modules/pages-legales.md) | CGU, Confidentialité, Suppression des données | Actif |
| [modules/navigation.md](modules/navigation.md) | Navigation dashboard et admin | Actif |

### Référence

| Fichier | Contenu |
|---|---|
| [glossaire.md](glossaire.md) | Termes spécifiques au projet |
| [points-attention.md](points-attention.md) | Dette technique, risques, idées d'amélioration |
