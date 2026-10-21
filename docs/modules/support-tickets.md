# Support et tickets d'assistance — Actif

> Dernière mise à jour : 2026-10-21
> Source : `src/lib/support.functions.ts`, `src/routes/_authenticated/dashboard.support.tsx`, `src/routes/_authenticated/admin.support.tsx`, `supabase/migrations/20261015000001_support_and_tickets.sql`

---

## 1. À quoi ça sert

Permet aux commerçants d'obtenir une assistance technique ou commerciale en ouvrant des tickets structurés avec pièces jointes (captures d'écran). L'équipe administrative dispose d'un espace de traitement complet avec gestion des priorités, statuts, réponses rapides et notes internes confidentielles.

---

## 2. Qui l'utilise

- [x] Commerçant (création de tickets, échange de messages, fermeture)
- [x] Administrateur (réception, assignation, réponses, notes internes, archivage)
- [ ] Client final

---

## 3. Parcours utilisateur

```
Côté commerçant (/dashboard/support) :
1. Consultation de ses tickets (en cours, résolus)
2. Clic sur « Nouveau ticket »
3. Remplissage : Sujet, Catégorie (Technique, Paiement, Boutique, Autre), Message, Pièce jointe optionnelle
4. Numéro séquentiel T-XXXX attribué automatiquement
5. Notification e-mail à l'admin
6. Réception de notifications e-mail à chaque réponse du support

Côté administrateur (/admin/support) :
1. File de traitement des tickets triés par statut (Ouvert, En cours, En attente, Résolu, Fermé)
2. Consultation de l'historique de la boutique et du commerçant
3. Rédaction d'une réponse publique (envoyée par e-mail et visible sur le dashboard)
4. Ou rédaction d'une note interne (visible uniquement par les administrateurs)
5. Changement de statut ou clôture
```

---

## 4. Écrans et routes

| Route | Fichier | Description |
|---|---|---|
| `/dashboard/support` | `src/routes/_authenticated/dashboard.support.tsx` | Espace d'assistance côté commerçant |
| `/admin/support` | `src/routes/_authenticated/admin.support.tsx` | Espace de modération et réponse côté admin |

---

## 5. Données

### Tables utilisées

| Table | Opérations | Notes |
|---|---|---|
| `support_tickets` | INSERT, SELECT, UPDATE | Table principale avec numéro séquentiel `numero` (T-XXXX) |
| `support_messages` | INSERT, SELECT | Messages horodatés échangés sur le ticket |
| `support_attachments` | INSERT, SELECT | Pièces jointes (images d'illustration) |

### Colonnes importantes (`support_tickets`)
- `numero` : texte généré par séquence (`T-1001`, `T-1002`, etc.)
- `shop_id` : boutique rattachée
- `sujet` : intitulé de la demande
- `statut` : `ouvert`, `en_cours`, `en_attente`, `resolu`, `ferme`
- `priorite` : `basse`, `normale`, `haute`, `urgente`
- `dernier_message_le` : horodatage mis à jour par trigger pour le tri de la file

### Colonnes importantes (`support_messages`)
- `is_internal` : booléen. Si `true`, le message est une note interne invisible pour le commerçant.
- `author_role` : `merchant` ou `admin`.

---

## 6. Logique serveur

### Fonctions serveur (`src/lib/support.functions.ts`)

| Fonction | Rôle |
|---|---|
| `createSupportTicketFn` | Crée un ticket, vérifie les quotas de création et notifie l'équipe |
| `replySupportTicketFn` | Ajoute un message public ou une note interne et alerte le destinataire |
| `updateTicketStatusFn` | Modifie le statut (fermé, résolu, en attente) |
| `getSupportTicketsFn` | Récupère la liste filtrée pour le commerçant ou l'admin |

---

## 7. E-mails et notifications

| Déclencheur | Destinataire | Détail |
|---|---|---|
| Nouveau ticket commerçant | Administrateur | Notification avec numéro de ticket et résumé du message |
| Réponse administrateur | Commerçant | Notification invitant à consulter la réponse sur le dashboard |
| Réponse commerçant | Administrateur | Notification signalant une relance sur le ticket |

---

## 8. Règles métier

- **Numérotation unique** : utilisation d'une séquence PostgreSQL dédiée `support_ticket_number_seq`.
- **Réouverture automatique** : si un commerçant répond à un ticket déjà `resolu` ou `ferme`, le trigger réactive automatiquement le statut à `en_cours`.
- **Confidentialité des notes internes** : la politique RLS PostgreSQL filtre strictement `is_internal = true` pour interdire tout accès en lecture aux commerçants.
- **Limitation d'abus (Rate limit)** :
  - Maximum 5 tickets créés par commerçant par heure.
  - Maximum 30 messages par commerçant par heure.

---

## 9. Dépendances avec d'autres modules

- [Boutiques](boutiques.md) : contexte du commerçant associé
- [Factures et e-mails](factures-emails.md) : envoi des notifications de suivi

---

## 10. Sécurité — ce qui est vérifié côté serveur

- RLS renforcée : un commerçant ne peut lire ni insérer que dans les tickets de sa propre boutique.
- Masquage serveur garanti des notes internes (`is_internal = false` dans la politique RLS publique).
- Contrôle de format et de taille sur les pièces jointes (images uniquement).

---

## 11. Limites connues et points à vérifier

- Les pièces jointes sont limitées aux images (captures d'écran PNG/JPG). Pas de support PDF pour l'instant.

---

## 12. Fichiers source principaux

- `src/lib/support.functions.ts`
- `src/routes/_authenticated/dashboard.support.tsx`
- `src/routes/_authenticated/admin.support.tsx`
- `supabase/migrations/20261015000001_support_and_tickets.sql`
