# Diffusions et annonces globales (Broadcasts) — Actif

> Dernière mise à jour : 2026-10-21
> Source : `src/lib/support.functions.ts`, `src/routes/_authenticated/admin.support.tsx`, `src/routes/api/public/broadcast-track.ts`, `supabase/migrations/20261017000001_shop_custom_category_and_broadcasts.sql`

---

## 1. À quoi ça sert

Permet aux administrateurs de MarketNet de diffuser des communications officielles (annonces de maintenance, nouveautés, alertes) à l'ensemble des commerçants ou à des segments ciblés (par plan, par ville). Le module gère l'affichage sous forme de bannières dans le dashboard, l'expédition e-mail et le suivi des taux de lecture via un pixel invisible.

---

## 2. Qui l'utilise

- [ ] Commerçant (consulte les annonces et peut les marquer comme lues)
- [x] Administrateur (rédige, planifie, cible et envoie les diffusions)
- [ ] Client final

---

## 3. Parcours utilisateur

```
Côté administrateur (/admin/support onglet Diffusions) :
1. Clic sur « Nouvelle diffusion »
2. Rédaction : Titre, Message, Niveau d'importance (Info, Succès, Avertissement, Urgent)
3. Ciblage : Tous les commerçants, ou filtrage par plan (ex: uniquement Pro et Business)
4. Option : Notification e-mail en complément de l'alerte dashboard
5. Expédition immédiate :
   ├── Création de l'enregistrement support_broadcasts
   ├── Génération des destinataires individuels dans support_broadcast_recipients
   └── Envoi asynchrone des e-mails avec pixel de tracking

Côté commerçant (/dashboard) :
1. Une bannière colorée ou modale s'affiche selon l'importance de l'annonce
2. Le commerçant peut cliquer sur « Marquer comme lu » pour masquer la notification
```

---

## 4. Écrans et routes

| Route / Fichier | Type | Description |
|---|---|---|
| `/admin/support` (onglet Diffusions) | Interface React | Création et consultation des campagnes de diffusion |
| `/dashboard` | Interface React | Affichage des bannières d'annonces non lues |
| `/api/public/broadcast-track` | Route API GET | Pixel transparent 1x1 GIF pour mesurer l'ouverture e-mail |

---

## 5. Données

### Tables utilisées

| Table | Opérations | Notes |
|---|---|---|
| `support_broadcasts` | INSERT, UPDATE, SELECT (admin) | Définition de l'annonce, niveau, filtres de ciblage |
| `support_broadcast_recipients` | INSERT, UPDATE, SELECT | Table de liaison commerçant/annonce avec état de lecture |

### Colonnes importantes (`support_broadcasts`)
- `titre` : en-tête court de l'annonce
- `contenu` : corps du message
- `niveau` : `info`, `succes`, `alerte`, `urgent`
- `filtre_plan` : tableau des plans ciblés ou `null` pour tous
- `envoyer_email` : booléen activant l'expédition SMTP

### Colonnes (`support_broadcast_recipients`)
- `shop_id` / `user_id` : commerçant ciblé
- `lu_le` : horodatage de la lecture sur le dashboard
- `email_ouvert_le` : horodatage enregistré lors du chargement du pixel de tracking

---

## 6. Logique serveur

### Fonctions serveur (`src/lib/support.functions.ts`)

| Fonction | Rôle |
|---|---|
| `createBroadcastFn` | Crée la diffusion, génère les destinataires ciblés et déclenche les e-mails |
| `markBroadcastAsReadFn` | Permet au commerçant de marquer une annonce comme lue |
| `getUnreadBroadcastsFn` | Récupère les alertes actives et non encore acquittées pour la boutique |

### Pixel de suivi (`src/routes/api/public/broadcast-track.ts`)

- Endpoint public renvoyant un GIF 1x1 transparent (`image/gif`).
- Valide le token de tracking fourni dans les paramètres d'URL.
- Met à jour le champ `email_ouvert_le` dans la table `support_broadcast_recipients`.

---

## 7. E-mails et notifications

- Envoi groupé géré avec temporisation pour respecter les limites du serveur SMTP.
- Gabarit HTML officiel MarketNet intégrant le lien vers le dashboard et le pixel de suivi.

---

## 8. Règles métier

- Seuls les administrateurs ont le droit de créer ou programmer une diffusion.
- Une annonce d'importance `urgent` ne peut pas être masquée définitivement tant que l'incident ou l'alerte est actif.

---

## 9. Dépendances avec d'autres modules

- [Administration](administration.md) : outil de communication intégré à l'espace admin
- [Factures et e-mails](factures-emails.md) : infrastructure d'envoi SMTP

---

## 10. Sécurité — ce qui est vérifié côté serveur

- RLS : les commerçants ne peuvent lire que les diffusions qui leur sont expressément adressées via `support_broadcast_recipients`.
- Création protégée par la fonction PL/pgSQL `has_role(auth.uid(), 'admin')`.

---

## 11. Limites connues et points à vérifier

- Pour les volumes importants (plusieurs milliers de commerçants), l'envoi d'e-mails synchrone dans la fonction serveur devrait être déporté vers une file d'attente asynchrone (Queue / Worker).

---

## 12. Fichiers source principaux

- `src/lib/support.functions.ts`
- `src/routes/api/public/broadcast-track.ts`
- `src/routes/_authenticated/admin.support.tsx`
- `supabase/migrations/20261017000001_shop_custom_category_and_broadcasts.sql`
