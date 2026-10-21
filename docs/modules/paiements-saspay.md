# Paiements SasPay — Actif

> Dernière mise à jour : 2026-10-21
> Source : `src/lib/saspay.server.ts`, `src/routes/api/public/webhook-saspay.ts`, `src/routes/abonnement/retour.tsx`, `supabase/migrations/20261014000000_saspay_and_subscriptions.sql`

---

## 1. À quoi ça sert

Permet le règlement des abonnements MarketNet en Franc Congolais (CDF) via la passerelle de paiement **SasPay** (Mobile Money : M-Pesa, Airtel Money, Orange Money, et Cartes bancaires). Intègre la création de session, la redirection, la réception sécurisée par webhook avec vérification de signature cryptographique, et la synchronisation de l'état de l'abonnement.

---

## 2. Qui l'utilise

- [x] Commerçant (paiement de son forfait)
- [x] Administrateur (suivi des encaissements, audit des webhooks, résolution d'anomalies)
- [ ] Client final (les commandes produits se font sur WhatsApp, sans SasPay)

---

## 3. Parcours utilisateur

```
1. Initiation (/dashboard/abonnement)
   └── Clic sur « Payer par Mobile Money / Carte »
   └── Appel serveur createSaspayCheckoutSessionFn
   └── Insertion d'un enregistrement dans subscription_payments (statut: en_attente)
   └── Appel API SasPay pour générer l'URL de paiement
   └── Redirection du navigateur vers la page hébergée SasPay

2. Paiement chez SasPay
   └── Le commerçant choisit son opérateur (M-Pesa, Orange, Airtel, Visa/Mastercard)
   └── Validation du paiement (code PIN sur mobile ou 3D Secure)

3. Confirmation asynchrone (Webhook)
   └── SasPay envoie une requête POST à /api/public/webhook-saspay
   └── Vérification signature HMAC-SHA256 et timestamp anti-rejeu
   └── Idempotence vérifiée via payment_events
   └── Si paiement confirmé :
       ├── Mise à jour subscription_payments -> payé
       ├── Extension de l'abonnement shops.plan_expires_at
       ├── Enregistrement merchant_subscriptions
       └── Envoi e-mail avec facture PDF

4. Retour commerçant (/abonnement/retour)
   └── Redirection par SasPay avec session_id
   └── Vérification du statut en base et affichage du message de confirmation
```

---

## 4. Écrans et routes

| Route | Fichier | Description |
|---|---|---|
| `/abonnement/retour` | `src/routes/abonnement/retour.tsx` | Page de retour après redirection depuis SasPay |
| `/api/public/webhook-saspay` | `src/routes/api/public/webhook-saspay.ts` | Endpoint de notification instantanée SasPay |
| `/admin/paiements` | `src/routes/_authenticated/admin.paiements.tsx` | Suivi des transactions et audit admin |

---

## 5. Données

### Tables utilisées

| Table | Opérations | Notes |
|---|---|---|
| `subscription_payments` | INSERT, UPDATE, SELECT | Suivi unitaire de chaque tentative ou succès |
| `payment_events` | INSERT, SELECT | Journal brut des payloads webhook (idempotence) |
| `shops` | UPDATE | Mise à jour du plan et date d'expiration |
| `merchant_subscriptions` | INSERT/UPDATE | Enregistrement de la période active |

### Colonnes importantes (`subscription_payments`)
- `saspay_session_id` : identifiant de session externe fourni par SasPay
- `saspay_transaction_id` : identifiant final de transaction
- `montant_cdf` : montant facturé en FC
- `montant_debite` : montant réel débité
- `statut` : `en_attente`, `paye`, `echoue`, `a_verifier`
- `metadata` : JSONB contenant le cycle, le plan et les infos de contexte

---

## 6. Logique serveur

### Client SasPay (`src/lib/saspay.server.ts`)

- `createCheckoutSession()` : prépare et appelle l'API SasPay pour obtenir `checkout_url`
- `verifyWebhookSignature()` : vérifie `X-SasPay-Signature` avec HMAC-SHA256 (`SASPAY_WEBHOOK_SECRET`)
- `getTransactionStatus()` : interrogation directe de l'état d'une transaction

### Webhook HTTP (`src/routes/api/public/webhook-saspay.ts`)

- **Contrôle d'horodatage** : rejet si la requête a plus de 300 secondes de décalage
- **Signature constante** : comparaison sécurisée via `crypto.timingSafeEqual`
- **Idempotence stricte** : déduplication basée sur `transaction_id` et `event_type` dans `payment_events`
- **Traitement transactionnel** : activation atomique de l'abonnement et déclenchement de la facture PDF

---

## 7. E-mails et notifications

| Déclencheur | Destinataire | Fonction |
|---|---|---|
| Webhook paiement validé | Commerçant | `sendSubscriptionSuccessNotification()` + facture PDF |
| Échec ou anomalie webhook | Administrateur | Alerte système / statut `a_verifier` |

---

## 8. Règles métier

- Devise **exclusive** : Franc Congolais (CDF). Aucune transaction SasPay en USD.
- Les montants sont vérifiés strictement : un écart entre le montant attendu et le montant reçu classe la transaction en statut `a_verifier`.
- L'attribution manuelle par un administrateur contourne SasPay mais crée une ligne `methode = 'manuel'` dans `subscription_payments`.

---

## 9. Dépendances avec d'autres modules

- [Abonnements](abonnements.md) : met à jour le statut et la durée
- [Factures et e-mails](factures-emails.md) : génère le reçu PDF après validation
- [Administration](administration.md) : interface d'audit et de rapprochement

---

## 10. Sécurité — ce qui est vérifié côté serveur

- `SASPAY_SECRET_KEY` et `SASPAY_WEBHOOK_SECRET` sont strictement confinés au serveur.
- Vérification systématique de l'authenticité de la requête SasPay (HMAC-SHA256).
- Protection anti-rejeu par horodatage (fenêtre max de 5 minutes).
- Déduplication cryptographique de chaque événement webhook.

---

## 11. Limites connues et points à vérifier

- Mode sandbox vs production : la bascule se fait via `SASPAY_ENV=live`. À vérifier avant la mise en service réelle.
- En cas de coupure réseau lors du webhook, SasPay effectue des réessais automatiques gérés par notre idempotence.

---

## 12. Fichiers source principaux

- `src/lib/saspay.server.ts`
- `src/routes/api/public/webhook-saspay.ts`
- `src/routes/abonnement/retour.tsx`
- `src/routes/_authenticated/admin.paiements.tsx`
- `supabase/migrations/20261014000000_saspay_and_subscriptions.sql`
