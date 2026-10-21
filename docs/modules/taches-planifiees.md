# Tâches planifiées et Crons — Actif

> Dernière mise à jour : 2026-10-21
> Source : `src/routes/api/cron/process-account-deletions.ts`, `src/routes/api/cron/subscription-reminders.ts`, `src/integrations/supabase/cron-auth.ts`

---

## 1. À quoi ça sert

Assure l'exécution des opérations différées et récurrentes de maintenance de MarketNet : rappels d'échéance d'abonnements, gestion des transitions vers la période de grâce, notifications de fin de validité, et exécution automatisée du workflow de suppression de compte (relance à J-7 et purge définitive à J30).

---

## 2. Qui l'utilise

- [ ] Commerçant
- [ ] Administrateur
- [ ] Client final
- [x] Robots / Planificateurs externes (Vercel Cron Jobs, GitHub Actions, ou planificateur HTTP externe)

---

## 3. Endpoints disponibles

### 1. Gestion des suppressions de compte
- **Route** : `POST /api/cron/process-account-deletions`
- **Fichier** : `src/routes/api/cron/process-account-deletions.ts`
- **Fréquence recommandée** : Toutes les 10 à 15 minutes
- **Actions accomplies** :
  1. Identifie les demandes où `now() >= scheduled_purge_at - INTERVAL '7 days'` et `reminder_sent_at IS NULL` -> expédie l'e-mail de rappel ultime à J-7 et horodate `reminder_sent_at`.
  2. Identifie les demandes où `now() >= scheduled_purge_at` et `statut = 'pending'` -> invoque `perform_account_final_deletion()` pour purger définitivement les données.

### 2. Rappels et cycle d'abonnement
- **Route** : `POST /api/cron/subscription-reminders`
- **Fichier** : `src/routes/api/cron/subscription-reminders.ts`
- **Fréquence recommandée** : Une fois par jour (ex: à 08h00 heure de Kinshasa)
- **Actions accomplies** :
  1. Identifie les abonnements expirant dans 7 jours ou 2 jours -> envoie les e-mails de préavis de renouvellement en évitant les doublons via la table `subscription_reminder_log`.
  2. Identifie les abonnements expirés du jour -> active la période de grâce de 3 jours.
  3. Identifie les périodes de grâce échues -> bascule la boutique vers le plan `free` et masque temporairement les produits et promotions excédentaires.

---

## 4. Authentification et sécurité des crons

Fichier de garde : `src/integrations/supabase/cron-auth.ts`

Toutes les routes d'API cron vérifient la présence d'un secret partagé :
```http
POST /api/cron/process-account-deletions
Authorization: Bearer <CRON_SECRET>
```

- Si le header `Authorization` est absent ou non conforme à la variable d'environnement `CRON_SECRET`, la requête est immédiatement rejetée avec un code HTTP `401 Unauthorized`.
- Cette mesure empêche tout déclenchement non autorisé par des tiers sur le web.

---

## 5. Données manipulées

| Table | Rôle |
|---|---|
| `account_deletion_requests` | Recherche des échéances de rappel et de purge |
| `account_deletion_audit` | Inscription de la trace de suppression légale |
| `subscription_reminder_log` | Déduplication stricte des e-mails de relance d'abonnement |
| `shops` / `merchant_subscriptions` | Mise à jour du plan et du statut |

---

## 6. Logs et observabilité

Chaque invocation de cron renvoie un résumé JSON complet de l'opération :
```json
{
  "success": true,
  "remindersSent": 2,
  "accountsPurged": 1,
  "timestamp": "2026-10-21T12:00:00Z"
}
```
En cas d'échec d'une purge unitaire, l'erreur est consignée dans les logs serveur sans interrompre le traitement du reste du lot.

---

## 7. Règles métier

- **Tolérance aux pannes** : si un cron ne tourne pas pendant 24h, son exécution suivante rattrapera automatiquement l'ensemble des purges et rappels en retard sans rupture de cohérence.
- **Déduplication** : la table `subscription_reminder_log` garantit qu'un commerçant ne recevra jamais deux fois le même rappel pour la même échéance.

---

## 8. Limites connues et points à vérifier

- À vérifier : s'assurer que le service planificateur externe (ex: Cron Jobs de Vercel) transmet correctement l'en-tête `Authorization: Bearer ...` lors de ses requêtes POST.

---

## 9. Fichiers source principaux

- `src/routes/api/cron/process-account-deletions.ts`
- `src/routes/api/cron/subscription-reminders.ts`
- `src/integrations/supabase/cron-auth.ts`
- `supabase/migrations/20261015000001_support_and_tickets.sql`
- `supabase/migrations/20261020000000_account_deletion_workflow.sql`
