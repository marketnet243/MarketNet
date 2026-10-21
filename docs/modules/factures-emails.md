# Factures PDF et e-mails transactionnels — Actif

> Dernière mise à jour : 2026-10-21
> Source : `src/lib/invoices.server.ts`, `src/lib/support-email.server.ts`, `src/routes/api/public/invoice-pdf.ts`

---

## 1. À quoi ça sert

Assure la génération de documents officiels au format PDF (quittances/factures d'abonnement et lettres d'attribution administrative) avec la bibliothèque `pdf-lib`, ainsi que l'expédition de tous les e-mails transactionnels et notifications du système via Nodemailer (SMTP).

---

## 2. Qui l'utilise

- [x] Commerçant (réception des e-mails, téléchargement de ses factures)
- [x] Administrateur (notifications système, consultation et génération des reçus/lettres)
- [ ] Client final

---

## 3. Parcours utilisateur

```
Téléchargement facture PDF :
1. Commerçant ou admin clique sur « Télécharger facture »
2. Appel GET /api/public/invoice-pdf?paymentId=...&token=...
3. Vérification de sécurité / token
4. Génération à la volée du document PDF par pdf-lib
5. Téléchargement direct avec Content-Type: application/pdf

Envoi d'e-mails transactionnels :
1. Un événement métier se produit (paiement réussi, nouveau ticket, réponse admin, alerte suppression)
2. Appel de la fonction d'envoi dans invoices.server.ts ou support-email.server.ts
3. Construction du contenu HTML avec la charte graphique MarketNet
4. Expédition via le transporteur SMTP Nodemailer
5. Traçabilité enregistrée dans la table notification_outbox
```

---

## 4. Écrans et routes

| Route / Fichier | Type | Description |
|---|---|---|
| `/api/public/invoice-pdf` | Route API HTTP GET | Téléchargement du PDF de facture ou d'attribution |
| `src/lib/invoices.server.ts` | Bibliothèque serveur | Génération PDF et notifications de facturation |
| `src/lib/support-email.server.ts` | Bibliothèque serveur | Expédition des notifications liées au support et diffusions |

---

## 5. Données

### Tables utilisées

| Table | Opérations | Notes |
|---|---|---|
| `notification_outbox` | INSERT, UPDATE, SELECT | Journalisation des e-mails envoyés avec statut (`succes`, `echec`) |
| `subscription_payments` | SELECT | Données sources pour la facture PDF |
| `shops` / `profiles` | SELECT | Coordonnées du commerçant |

---

## 6. Logique serveur

### Génération PDF (`src/lib/invoices.server.ts`)

- **Technologie** : `pdf-lib` (sans dépendance externe type Puppeteer ou Chromium, fonctionne en environnement serverless léger)
- **Mise en page** : En-tête MarketNet, numéro de facture normalisé (`FACT-YYYYMM-XXXX`), coordonnées boutique, montant en Francs Congolais (CDF), détail du plan et du cycle, mention légale et date d'échéance.
- **Lettres d'attribution** : document distinct pour les plans offerts ou sponsorisés par l'administration, avec signature officielle et motif légal.

### Expédition SMTP (`Nodemailer`)

- Configuration via variables d'environnement (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_NAME`).
- Fuseau horaire de référence pour les horodatages : `Africa/Kinshasa`.
- Tolérance aux pannes : en cas d'indisponibilité SMTP, une erreur est consignée dans `notification_outbox` sans bloquer le flux principal de l'utilisateur.

---

## 7. Catalogue des e-mails transactionnels

| Nom de la fonction | Événement déclencheur | Destinataire |
|---|---|---|
| `sendMerchantWelcomeEmail` | Création de boutique terminée | Commerçant |
| `sendNewUserAdminNotification` | Inscription nouvel utilisateur | Admin |
| `sendSubscriptionSuccessNotification` | Paiement SasPay validé | Commerçant (+ facture PDF) |
| `sendManualGrantNotification` | Attribution manuelle de plan | Commerçant (+ lettre PDF) |
| `sendTicketCreatedNotification` | Nouveau ticket de support ouvert | Admin |
| `sendTicketReplyNotification` | Réponse à un ticket | Commerçant ou Admin |
| `sendDeletionRequestedNotification` | Demande de suppression de compte | Commerçant + Admin |
| `sendDeletionReminderNotification` | Rappel J-7 avant purge définitive | Commerçant |
| `sendDeletionCancelledNotification` | Annulation de suppression | Commerçant + Admin |

---

## 8. Règles métier

- Toutes les factures mentionnent les montants en **Franc Congolais (FC)**.
- Les e-mails de notification utilisent un gabarit HTML soigné aux couleurs de MarketNet (Orange chaud, typographie soignée).
- Conformité RGPD / Données personnelles : mention des liens de désinscription ou de contact légal.

---

## 9. Dépendances avec d'autres modules

- [Paiements SasPay](paiements-saspay.md) : déclenche la génération de facture
- [Abonnements](abonnements.md) : apporte les informations de plan et de validité
- [Support et tickets](support-tickets.md) : envoie les notifications de suivi
- [Suppression de compte](suppression-compte.md) : envoie les préavis et confirmations

---

## 10. Sécurité — ce qui est vérifié côté serveur

- Identifiants SMTP (`SMTP_PASSWORD`) strictement confinés à l'environnement serveur.
- Téléchargement des factures sécurisé par contrôle de rôle (`admin` ou commerçant propriétaire de la facture).

---

## 11. Limites connues et points à vérifier

- À vérifier : la boîte de réception SMTP doit avoir un SPF / DKIM configuré sur le domaine pour éviter le classement en spam.
- Le style des e-mails contient quelques emojis dans certains modèles (ex: 🎫, 💬), à harmoniser selon les futures règles de style.

---

## 12. Fichiers source principaux

- `src/lib/invoices.server.ts`
- `src/lib/support-email.server.ts`
- `src/routes/api/public/invoice-pdf.ts`
- `supabase/migrations/20261015000001_support_and_tickets.sql` (table `notification_outbox`)
