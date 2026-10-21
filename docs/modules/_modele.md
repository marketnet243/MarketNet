# [Nom du module] — [État : actif | partiel | désactivé]

> Dernière mise à jour : [DATE]
> Source : analyse du code

---

## 1. À quoi ça sert

[2 à 4 phrases décrivant le rôle de ce module dans le système.]

---

## 2. Qui l'utilise

- [ ] Commerçant
- [ ] Administrateur
- [ ] Client final (visiteur anonyme)

---

## 3. Parcours utilisateur

```
1. [Étape 1]
   └── [Détail]

2. [Étape 2]
   └── [Détail]
```

---

## 4. Écrans et routes

| Route | Fichier | Description |
|---|---|---|
| `/[route]` | `src/routes/[fichier].tsx` | [Description] |

---

## 5. Données

### Tables utilisées

| Table | Opérations | Notes |
|---|---|---|
| `[table]` | SELECT, INSERT, UPDATE | [Particularités] |

### RLS et GRANT

- `anon` : [accès ou aucun]
- `authenticated` : [accès]
- `service_role` : ALL

### Colonnes importantes

- `[colonne]` : [description]

---

## 6. Logique serveur

### Fonctions serveur (`createServerFn`)

| Fonction | Fichier | Rôle |
|---|---|---|
| `[fonctionFn]` | `src/lib/[fichier].ts` | [Description] |

### Routes API / Tâches planifiées

| Route / Cron | Méthode | Rôle |
|---|---|---|
| `/api/[route]` | POST | [Description] |

---

## 7. E-mails et notifications

| Déclencheur | Destinataire | Fonction |
|---|---|---|
| [Événement] | Commerçant | `[fonction]()` |

---

## 8. Règles métier

- [Limite ou règle 1]
- [Limite ou règle 2]

| Plan | Limite |
|---|---|
| Gratuit | [valeur] |
| Pro | [valeur] |
| Business | [valeur] |

---

## 9. Dépendances avec d'autres modules

- [Abonnements](abonnements.md) — [pourquoi]
- [Boutiques](boutiques.md) — [pourquoi]

---

## 10. Sécurité — ce qui est vérifié côté serveur

- [Vérification 1]
- [Vérification 2]

---

## 11. Limites connues et points à vérifier

- À vérifier : [point]
- Limite connue : [point]

---

## 12. Fichiers source principaux

- `src/routes/[fichier].tsx`
- `src/lib/[fichier].ts`
- `supabase/migrations/[migration].sql`
