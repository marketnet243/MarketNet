# Design System — MarketNet

> Dernière mise à jour : 2026-10-21
> Source : `src/styles.css`, `src/routes/__root.tsx`, `src/components/ui/`

---

## Polices

| Rôle | Police | Graisses chargées |
|---|---|---|
| Corps du texte (`--font-sans`) | Figtree | 400, 500, 600, 700 |
| Titres (`--font-display`) | Bricolage Grotesque | 600, 800 (opsz 12-96) |
| Thème boutique "Boutique" uniquement | Playfair Display | 600, 700 |

Chargées depuis Google Fonts dans `src/routes/__root.tsx`.

Les titres h1, h2, h3 utilisent automatiquement `--font-display` avec `letter-spacing: -0.02em`.

---

## Couleurs du dashboard (thème clair uniquement — pas de thème sombre implémenté)

| Variable CSS | Valeur OKLCH | Usage |
|---|---|---|
| `--background` | oklch(0.985 0.008 80) | Fond de page |
| `--foreground` | oklch(0.23 0.03 45) | Texte principal |
| `--card` | oklch(1 0 0) | Fond des cartes |
| `--card-foreground` | oklch(0.23 0.03 45) | Texte dans les cartes |
| `--primary` | oklch(0.66 0.19 42) | Orange MarketNet (#E8590C approx.) |
| `--primary-foreground` | oklch(0.99 0.005 80) | Texte sur fond primary |
| `--secondary` | oklch(0.95 0.025 75) | Fond secondaire léger |
| `--muted` | oklch(0.955 0.012 75) | Éléments atténués |
| `--muted-foreground` | oklch(0.5 0.03 50) | Texte secondaire |
| `--accent` | oklch(0.93 0.05 70) | Accent |
| `--destructive` | oklch(0.58 0.22 27) | Rouge erreur/suppression |
| `--success` | oklch(0.6 0.14 155) | Vert succès |
| `--whatsapp` | oklch(0.63 0.17 150) | Vert WhatsApp |
| `--border` | oklch(0.9 0.015 70) | Bordures |
| `--input` | oklch(0.88 0.018 70) | Fond des champs de saisie |
| `--ring` | oklch(0.66 0.19 42) | Focus ring |

### Gradients et ombres
| Variable | Valeur | Usage |
|---|---|---|
| `--gradient-warm` | linear-gradient(135deg, ...) | Fond dégradé chaud |
| `--shadow-soft` | 0 10px 30px -12px ... | Ombre légère des cartes |
| `--shadow-lift` | 0 20px 50px -20px ... | Ombre forte au survol |

---

## Rayons de bordure

| Variable | Calcul | Usage |
|---|---|---|
| `--radius` | 1rem (base) | — |
| `--radius-sm` | calc(1rem - 4px) | Petits éléments |
| `--radius-md` | calc(1rem - 2px) | Éléments moyens |
| `--radius-lg` | 1rem | Standard |
| `--radius-xl` | calc(1rem + 4px) | Grands éléments |
| `--radius-2xl` | calc(1rem + 8px) | Modales |
| `--radius-3xl` | calc(1rem + 12px) | Grandes cartes |

---

## Thèmes de vitrine de boutique

Les boutiques peuvent appliquer un thème via la classe CSS sur le conteneur :

| Classe | Fond | Typographie titres | Rayon | Description |
|---|---|---|---|---|
| `.theme-savane` | Chaud sable clair | Bricolage Grotesque | 1.25rem | Défaut chaud africain |
| `.theme-minuit` | Bleu très sombre | Bricolage Grotesque | 0.75rem | Mode sombre nuit |
| `.theme-boutique` | Blanc rosé léger | Playfair Display | 0.25rem | Élégant boutique |
| `.theme-marche` | Jaune chaud vif | Bricolage Grotesque | 1.75rem | Marché coloré |
| `.theme-pur` | Blanc pur | Figtree | 0rem | Minimaliste sans radius |
| `.theme-oasis` | Bleu-vert clair | Bricolage Grotesque | 1rem | Fraîcheur tropicale |

Les thèmes de boutique utilisent les variables `--shop-*` :
- `--shop-bg`, `--shop-fg`, `--shop-card`, `--shop-muted`
- `--shop-primary` (couleur principale personnalisée par le commerçant)
- `--shop-radius`, `--shop-font`, `--shop-heading`

---

## Composants UI (src/components/ui/)

Basés sur Radix UI, stylisés avec Tailwind. Source : `src/components/ui/`.

| Composant | Fichier | Variantes principales |
|---|---|---|
| Button | `button.tsx` | default, destructive, outline, secondary, ghost, link |
| Badge | `badge.tsx` | default, secondary, destructive, outline |
| Card | `card.tsx` | Card, CardHeader, CardContent, CardFooter, CardTitle |
| Input | `input.tsx` | — |
| Textarea | `textarea.tsx` | — |
| Select | `select.tsx` | — |
| Dialog | `dialog.tsx` | Modal plein écran |
| Sheet | `sheet.tsx` | Panneau latéral (panier, menus) |
| Drawer | `drawer.tsx` | Tiroir mobile |
| Tabs | `tabs.tsx` | Navigation par onglets |
| Alert | `alert.tsx` | default, destructive |
| AlertDialog | `alert-dialog.tsx` | Confirmation avec boutons |
| Skeleton | `skeleton.tsx` | État de chargement |
| Sonner | `sonner.tsx` | Toasts de notification (bibliothèque sonner) |
| Sidebar | `sidebar.tsx` | Barre latérale dashboard |
| Table | `table.tsx` | Tableaux de données |
| Progress | `progress.tsx` | Barre de progression |
| Tooltip | `tooltip.tsx` | Infobulles |
| Popover | `popover.tsx` | Contenus flottants |
| Calendar | `calendar.tsx` | Sélecteur de date |
| Chart | `chart.tsx` | Graphiques (Recharts wrappé) |
| Carousel | `carousel.tsx` | Carrousel (Embla) |
| Avatar | `avatar.tsx` | Avatar utilisateur |
| Switch | `switch.tsx` | Interrupteur |
| Separator | `separator.tsx` | Ligne de séparation |

---

## Composants métier

### StoreParts (`src/components/store/StoreParts.tsx`)
Composants de la vitrine publique : `StoreHeader`, `StoreProductCard`, `StoreProductGrid`, `StoreCategoryFilter`, `StoreSearchBar`, `StoreFooter`.

### CartSheet (`src/components/store/CartSheet.tsx`)
Panneau latéral du panier client. Gère les devises mixtes (USD et CDF).

### StoreOfflineView (`src/components/store/StoreOfflineView.tsx`)
Affichage quand la boutique n'est pas publiée ou suspendue.

### PromoBanner (`src/components/promo/PromoBanner.tsx`)
Bandeau promotionnel animé (marquee) affiché en haut de la vitrine.

### PromoSlide (`src/components/promo/PromoSlide.tsx`)
Affiche une promotion avec ses 5 templates. Utilisé dans le carrousel de la vitrine et dans la page promotion dédiée.

### ShopFields (`src/components/dashboard/ShopFields.tsx`)
Formulaire de création/modification de boutique.

### ShopPreview (`src/components/dashboard/ShopPreview.tsx`)
Aperçu temps réel de la boutique (mobile et desktop).

---

## Modèles de promotions (PromoTemplate)

| Template | Nom | Description |
|---|---|---|
| `fullscreen` | Hero Immersif | Fond plein écran, cartouche en verre dépoli |
| `split` | Duo Showcase | Affichage asymétrique texte/produit |
| `badge` | Flash Impact | Badge coloré en relief, contraste élevé |
| `countdown` | Chrono Urgence | Compte à rebours dynamique (jours, heures, min, sec) |
| `minimal` | Studio Élégance | Typographie épurée, pastille d'édition (seul template sans image obligatoire) |

---

## Animations

| Classe | Effet |
|---|---|
| `.animate-marquee` | Défilement horizontal infini (bandeau promo), pause au survol |
| Bibliothèque `tw-animate-css` | Animations CSS utilitaires via Tailwind |

---

## Sidebar (navigation dashboard)

Composant `src/components/ui/sidebar.tsx` (shadcn/ui sidebar).

- Structure : `SidebarProvider` > `Sidebar` > `SidebarContent` > `SidebarGroup` > `SidebarMenuItem`
- Navigation admin et commerçant définies dans `src/routes/_authenticated/dashboard.tsx` et `admin.tsx`

---

## États standards

| État | Composant recommandé |
|---|---|
| Chargement | `Skeleton` |
| Erreur | `Alert` variant destructive + message explicatif |
| Succès | Toast via `sonner` (`toast.success(...)`) |
| Vide | Section avec icône et texte explicatif (pas de composant dédié, style inline) |
| Confirmation destructive | `AlertDialog` |

---

## Règles de rédaction de l'interface

- **Langue** : français intégral avec accents (é, è, ê, à, ç…)
- **Ton** : professionnel, sobre, direct. Tutoiement côté commerçant, vouvoiement dans les e-mails.
- **Emojis** : interdits dans l'interface dashboard et admin. Tolérés uniquement dans les e-mails (et déjà présents dans certains).
- **Majuscules** : seulement en début de phrase et noms propres, pas de TOUT EN MAJUSCULES pour les titres.
- **Nombres** : utiliser `formatCDF()` pour les montants en FC.

---

## Incohérences relevées

1. **Certains e-mails contiennent des emojis** (ex. `buildNewTicketAdminHtml` : 🎫, `buildAdminReplyHtml` : 💬) alors que la règle est sans emojis. — `src/lib/support-email.server.ts`
2. **Couleur primaire écrite en dur** : `#E8590C` apparaît dans `__root.tsx` (meta theme-color) et dans les e-mails HTML. Si la couleur brand change, plusieurs fichiers seront à mettre à jour.
3. **Pas de mode sombre** pour le dashboard. La variable `@custom-variant dark` est déclarée mais aucune couleur sombre n'est définie hors des thèmes de boutique.
4. **Styles ad hoc** dans les routes de grandes pages (ex. `dashboard.promotions.tsx`, `admin.paiements.tsx`) : classes Tailwind inline longues, difficiles à maintenir.

---

## Règles à suivre pour toute nouvelle interface

1. Utiliser uniquement les variables CSS définies (pas de couleurs hexadécimales en dur sauf héritage existant).
2. Utiliser les composants de `src/components/ui/` plutôt que des éléments HTML nus.
3. Police : Figtree pour le corps, Bricolage Grotesque pour les titres.
4. Boutons primaires : `Button` variant `default` (fond `--primary`, texte `--primary-foreground`).
5. Pas d'emojis dans les composants React du dashboard/admin.
6. Textes en français avec accents.
7. Les pages de boutique publique utilisent les variables `--shop-*` pour respecter le thème choisi par le commerçant.
