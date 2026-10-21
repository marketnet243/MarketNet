# Panier et commande WhatsApp — Actif

> Dernière mise à jour : 2026-10-21
> Source : `src/components/store/CartSheet.tsx`, `src/routes/b.$slug.index.tsx`, `src/lib/cart.ts`

---

## 1. À quoi ça sert

Permet aux clients de la vitrine d'ajouter des produits à un panier local (sans connexion) et de passer commande via WhatsApp. La commande est enregistrée en base de données de manière autonome et le client est redirigé vers le numéro WhatsApp du commerçant avec un message pré-rempli.

---

## 2. Qui l'utilise

- [ ] Commerçant (reçoit les commandes)
- [ ] Administrateur (peut voir toutes les commandes)
- [x] Client final (ajoute au panier et commande)

---

## 3. Parcours utilisateur

```
1. /b/{slug} ou /b/{slug}/p/{productId}
   └── Clic "Ajouter au panier" ou "Acheter maintenant"
   └── CartSheet (panneau latéral) s'ouvre avec le contenu du panier

2. CartSheet
   └── Affiche les produits, quantités, prix (USD et/ou CDF séparément)
   └── Bouton "Commander sur WhatsApp"
   └── Saisie optionnelle : nom du client, adresse, note
   └── Clic "Envoyer la commande"

3. Traitement de la commande
   └── Enregistrement en base : table `orders` (INSERT par anon)
   └── Génération du message WhatsApp (format structuré)
   └── Ouverture de wa.me/{whatsapp}?text={message_encodé} dans un nouvel onglet
   └── Affichage confirmation dans l'interface
```

---

## 4. Écrans et routes

| Route | Fichier | Description |
|---|---|---|
| `/b/{slug}` | `src/routes/b.$slug.index.tsx` | Vitrine avec boutons panier |
| `/b/{slug}/p/{productId}` | `src/routes/b.$slug.p.$productId.tsx` | Page produit avec panier |

### Composants

- `src/components/store/CartSheet.tsx` : panneau latéral du panier
- `src/lib/cart.ts` : logique du panier (état local, calculs)

---

## 5. Données

### Tables utilisées

| Table | Opérations | Notes |
|---|---|---|
| `orders` | INSERT (anon) | Client non connecté |
| `orders` | SELECT, UPDATE | Commerçant (ses commandes) |

### Colonnes importantes (`orders`)

- `items` : JSONB — tableau des produits commandés avec nom, prix, devise, quantité, variantes
- `total_usd` : total calculé en USD (si produits USD)
- `total_cdf` : total calculé en CDF (si produits CDF)
- `customer_name` : nom fourni par le client (optionnel)
- `customer_address` : adresse fournie par le client (optionnel)
- `customer_note` : note supplémentaire (optionnel)
- `status` : new (initial), confirmed, delivered, cancelled
- `whatsapp_sent` : booléen — WhatsApp a été déclenché

### RLS

- `anon` : INSERT seulement (restriction par trigger rate limit : max 20 commandes/boutique/minute)
- `authenticated` : SELECT, INSERT, UPDATE (is_shop_owner ou admin)

---

## 6. Logique serveur

### Logique côté client (panier local)

Le panier n'est **pas persisté en base de données** avant que le client valide la commande. Il est conservé dans l'état React (mémoire du navigateur). Si le client ferme l'onglet, le panier est perdu.

### Format du message WhatsApp

Le message pré-rempli envoyé à WhatsApp est généré côté client et contient :
- Nom de la boutique
- Liste des produits (nom, quantité, prix, variantes si présentes)
- Totaux USD et/ou CDF séparément
- Nom, adresse et note du client si fournis
- Numéro de commande

---

## 7. Règles métier

- Le client **n'a pas de compte** sur la plateforme.
- Les devises USD et CDF sont calculées séparément (un panier peut contenir les deux).
- La commande est créée en base avant l'ouverture de WhatsApp (pour la traçabilité).
- Le commerçant reçoit la commande sur son téléphone via WhatsApp.
- Le commerçant peut ensuite changer le statut de la commande dans son dashboard.
- Rate limit : 20 commandes par boutique par minute (protection anti-spam par trigger).

---

## 8. Dépendances avec d'autres modules

- [Boutiques](boutiques.md) — lien WhatsApp du commerçant
- [Produits](produits.md) — contenu du panier

---

## 9. Sécurité — ce qui est vérifié côté serveur

- Trigger `orders_rate` : limite à 20 INSERT par boutique par minute (protection anti-abus)
- RLS : un client anon ne peut qu'insérer, pas lire les commandes existantes

---

## 10. Limites connues et points à vérifier

- Limite connue : le panier disparaît si le client rafraîchit la page ou ferme l'onglet.
- Limite connue : pas de paiement en ligne intégré (WhatsApp uniquement).
- À vérifier : comportement si le total est 0 FC et 0 USD (produit sans prix ?).
- À vérifier : affichage des variantes dans le message WhatsApp — format lisible ?

---

## 11. Fichiers source principaux

- `src/components/store/CartSheet.tsx`
- `src/lib/cart.ts`
- `src/routes/b.$slug.index.tsx`
- `src/routes/b.$slug.p.$productId.tsx`
- `supabase/migrations/20261009000000_initial_schema.sql` (table orders, trigger orders_rate)
