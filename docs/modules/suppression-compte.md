# Suppression de compte (Workflow 30 jours) — Actif

> Dernière mise à jour : 2026-10-21
> Source : `src/lib/account-deletion.functions.ts`, `src/routes/api/cron/process-account-deletions.ts`, `supabase/migrations/20261020000000_account_deletion_workflow.sql`, `src/routes/_authenticated/dashboard.reglages.tsx`

---

## 1. À quoi ça sert

Permet à un commerçant de demander la suppression intégrale de son compte et de ses données conformément aux réglementations de protection des données (RGPD et politique Meta). Le processus prévoit une période tampon de réflexion de 30 jours pendant laquelle la boutique est immédiatement dépubliée et suspendue, avec possibilité d'annulation, notification de rappel à J-7, et purge définitive automatisée par une tâche cron.

---

## 2. Qui l'utilise

- [x] Commerçant (demande de suppression, annulation pendant les 30 jours)
- [x] Administrateur (supervision des demandes en attente, audit, annulation d'urgence)
- [ ] Client final

---

## 3. Parcours utilisateur

```
1. Demande (/dashboard/reglages -> Zone de danger)
   └── Clic sur « Supprimer mon compte »
   └── Saisie du mot de passe pour confirmation
   └── Saisie optionnelle du motif
   └── Exécution de requestAccountDeletionFn :
       ├── Création d'une demande dans account_deletion_requests
       ├── Date de purge planifiée = Date actuelle + 30 jours
       ├── shops.is_published = false
       ├── shops.account_status = 'suspended_for_deletion'
       ├── profiles.account_status = 'suspended_for_deletion'
       ├── Envoi e-mail de confirmation avec date limite d'annulation
       └── Déconnexion immédiate de la session

2. Période de réflexion (J0 à J30)
   └── La boutique n'est plus accessible en public (page hors ligne)
   └── Le commerçant peut se reconnecter pour voir l'écran de suspension et cliquer sur « Annuler la suppression »
   └── À J-7 (23e jour) : le cron envoie un e-mail de rappel ultime

3. Purge définitive (J30+)
   └── Le cron /api/cron/process-account-deletions détecte la demande échue
   └── Appel de la fonction PostgreSQL perform_account_final_deletion()
   └── Suppression en cascade des produits, promotions, commandes, tickets, boutique, profil et utilisateur auth.users
   └── Consignation finale anonymisée dans account_deletion_audit
```

---

## 4. Écrans et routes

| Route | Fichier | Description |
|---|---|---|
| `/dashboard/reglages` | `src/routes/_authenticated/dashboard.reglages.tsx` | Formulaire de demande de suppression |
| `/admin/demandes-suppression` | `src/routes/_authenticated/admin.demandes-suppression.tsx` | Suivi et modération des demandes côté admin |
| `/api/cron/process-account-deletions` | `src/routes/api/cron/process-account-deletions.ts` | Endpoint cron automatisant rappels et purges |

---

## 5. Données

### Tables utilisées

| Table | Opérations | Notes |
|---|---|---|
| `account_deletion_requests` | INSERT, SELECT, UPDATE | Suivi de l'échéance des 30 jours et statut de la demande |
| `account_deletion_audit` | INSERT, SELECT (admin) | Journal d'audit légal immuable |
| `shops` | UPDATE (statut suspendu) puis DELETE | Dépubliée dès la demande |
| `profiles` / `auth.users` | UPDATE puis DELETE | Supprimé définitivement à terme |

### Colonnes importantes (`account_deletion_requests`)
- `user_id` / `shop_id` : identifiants du compte concerné
- `scheduled_purge_at` : horodatage exact de la purge définitive (création + 30 jours)
- `statut` : `pending` (en attente), `cancelled` (annulé), `completed` (purgé)
- `reminder_sent_at` : horodatage de l'e-mail de rappel envoyé à J-7
- `cancelled_at` : horodatage en cas d'annulation par l'utilisateur ou l'admin

---

## 6. Logique serveur

### Fonctions serveur (`src/lib/account-deletion.functions.ts`)

| Fonction | Rôle |
|---|---|
| `requestAccountDeletionFn` | Vérifie le mot de passe, initie le compte à rebours 30 jours, dépublie la boutique |
| `cancelAccountDeletionFn` | Rétablit le compte et la boutique si la période de 30 jours n'est pas expirée |
| `getAccountDeletionStatusFn` | Consulte l'état courant de la demande pour affichage dans le dashboard |

### Procédure stockée SQL (`perform_account_final_deletion`)

- Exécutée exclusivement avec les droits `service_role`.
- Purge de façon ordonnée les images Cloudinary (via événement), les tickets, promotions, produits, commandes, puis supprime le compte de `auth.users`.
- Inscrit un enregistrement dans `account_deletion_audit` (preuve de conformité légale sans conserver de données personnelles sensibles).

---

## 7. E-mails et notifications

| Événement | Destinataire | Détail |
|---|---|---|
| Demande initiée | Commerçant | Notification avec date limite d'annulation (J+30) |
| Demande initiée | Administrateur | Alerte signalant un départ |
| J-7 avant purge | Commerçant | Rappel ultime : « Votre compte sera définitivement effacé dans 7 jours » |
| Annulation | Commerçant | Confirmation du rétablissement immédiat de la boutique |
| Purge exécutée | Commerçant | Dernier avis de suppression complète |

---

## 8. Règles métier

- **Période stricte** : 30 jours calendaires incompressibles.
- **Droit au remords** : l'utilisateur peut annuler à tout moment avant l'échéance en se reconnectant.
- **Sécurité** : exigence de la ressaisie du mot de passe pour déclencher la demande.
- **Protection des données** : pendant les 30 jours, aucune nouvelle commande ne peut être passée (boutique masquée).

---

## 9. Dépendances avec d'autres modules

- [Boutiques](boutiques.md) et [Produits](produits.md) : masquage puis suppression en cascade
- [Tâches planifiées](taches-planifiees.md) : exécution automatique via le cron
- [Factures et e-mails](factures-emails.md) : expédition des préavis

---

## 10. Sécurité — ce qui est vérifié côté serveur

- La suppression définitive `perform_account_final_deletion` est interdite aux rôles `anon` et `authenticated` ; seul le `service_role` (utilisé par le cron avec token secret) peut l'invoquer.
- Trigger `shops_guard` et `profiles_guard` garantissant que le commerçant ne peut pas réactiver sa boutique sans passer par la procédure officielle d'annulation.

---

## 11. Limites connues et points à vérifier

- Les factures PDF déjà émises pour des motifs comptables doivent être conservées conformément aux lois fiscales locales sans porter atteinte au droit à l'effacement.

---

## 12. Fichiers source principaux

- `src/lib/account-deletion.functions.ts`
- `src/routes/api/cron/process-account-deletions.ts`
- `src/routes/_authenticated/dashboard.reglages.tsx`
- `src/routes/_authenticated/admin.demandes-suppression.tsx`
- `supabase/migrations/20261020000000_account_deletion_workflow.sql`
