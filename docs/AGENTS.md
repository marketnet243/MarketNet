# AGENTS.md — Règles obligatoires pour tout agent travaillant sur MarketNet

> Dernière mise à jour : 2026-10-21
> Source : analyse du code

---

## 1. Avant de travailler — Lecture obligatoire dans cet ordre

1. Ce fichier (`docs/AGENTS.md`)
2. `docs/README.md` — sommaire général
3. `docs/00-vue-ensemble.md` — ce qu'est MarketNet, les rôles, les parcours
4. `docs/regles-supabase.md` — règles d'accès base de données
5. `docs/design-system.md` — charte visuelle et composants
6. Le fichier du module concerné dans `docs/modules/`
7. Les fichiers des modules liés (repérés dans la section « Dépendances »)

**Avant de modifier quoi que ce soit**, rédige en quelques lignes :
- Ce que tu as compris du projet et du module concerné
- Ce que tu vas faire précisément
- Les fichiers que tu vas toucher

---

## 2. Règles générales

- **Ne casse rien d'existant.** Analyse le code réel avant d'écrire la moindre ligne.
- **Migrations additives uniquement.** Jamais de `DROP COLUMN`, `DROP TABLE`, ou modification destructive sans instruction explicite et confirmée.
- **RLS activée sur toute nouvelle table.** Voir `docs/regles-supabase.md`.
- **Sécurité et calculs de prix toujours côté serveur.** Jamais côté client.
- **Aucun secret dans le code, le dépôt ou les réponses.** Liste uniquement les noms de variables.
- **Textes de l'interface en français correct**, avec accents, sans emojis, sans abréviations familières.
- **Ne touche pas aux modules non concernés** par la tâche.
- **Signale avant d'agir** si l'instruction reçue contredit ces règles ou la documentation.

---

## 3. Règles Supabase — applique sans exception

Lire `docs/regles-supabase.md` intégralement. En résumé :

- Toute migration créant une table dans `public` doit contenir dans la **même migration** :
  - `GRANT` adaptés (anon / authenticated / service_role selon usage réel)
  - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
  - Les politiques RLS correspondantes
- Ne jamais désactiver la RLS pour « faire marcher ».
- Ne jamais accorder `anon` sur des tables sensibles (paiements, abonnements, tickets, suppressions, journaux).

---

## 4. Design

- Respecter `docs/design-system.md`.
- Utiliser les composants existants dans `src/components/ui/`.
- Ne pas inventer de nouvelles classes CSS quand un composant convient.
- Interface en français, sans emojis, police Figtree/Bricolage Grotesque.

---

## 5. Si une instruction contredit ces règles

Ne l'applique **pas en silence**. Signale le conflit à l'utilisateur avant d'agir, explique le risque, et propose une alternative conforme.

---

## 6. Fin de tâche — obligatoire sans exception

À la fin de chaque tâche, tu dois :

1. **Ajouter une entrée dans `docs/journal-des-travaux.md`** (la plus récente en haut) en suivant le modèle défini dans ce fichier.
2. **Mettre à jour** le fichier de module concerné si tu as modifié ou ajouté des fonctionnalités.
3. **Mettre à jour** `docs/glossaire.md` si tu introduis de nouveaux termes.
4. **Mettre à jour** `docs/points-attention.md` si tu as résolu ou créé des points d'attention.
5. **Donner à l'utilisateur** le même résumé que celui du journal (ce qui a été fait, ce qui a été testé, ce qui reste à vérifier).

**Règle d'honnêteté** : n'écris jamais qu'une chose fonctionne si tu ne l'as pas testée. Indique clairement ce qui a été vérifié et ce qui reste à tester.
