# Mode entraînement (`/practice`)

Réservé aux abonnés **Calc Rush+**. L'élève choisit un sujet, puis enchaîne une série de 5, 10
ou 20 questions : pas d'adversaire, pas de score pendant la série, temps limité par question
uniquement s'il le demande. Toute la boucle est gérée côté front.

Deux modes de sujet (`PracticeMode` : `'notion' | 'timesTables'`) :

- **Par notion** : un niveau, une catégorie et une notion (un type de prompt).
- **Tables de multiplication** : une ou plusieurs tables, indépendantes du niveau scolaire.

Le sujet de la série est un `PracticeTopic` (`services/practice.ts`), union discriminée :
`{ kind: 'notion', level, category, promptType }` ou `{ kind: 'timesTables', tables: number[] }`.

## Backend contract

| Route                                                   | Auth   | Réponse                                                          |
| ------------------------------------------------------- | ------ | ---------------------------------------------------------------- |
| `GET /practice/catalog`                                 | Bearer | `{ [Level]: { [category]: promptType[] } }` (statique)           |
| `GET /practice/{level}/{category}/{prompt_type}`        | Bearer | `{ prompt, answer }` : une question aléatoire par appel          |
| `GET /practice/times-tables`                            | Bearer | `{ tables: number[] }` : tables proposées (statique)             |
| `GET /practice/times-tables/question?tables=2&tables=7` | Bearer | `{ prompt, answer }` : une question sur l'une des tables passées |

Les deux routes de question renvoient aussi `unlocked_icon: { id, rarity, url } | null`
(optionnel : absent ou `null` = rien de débloqué). Chaque question demandée compte comme un
effort d'entraînement ; le back accorde une icône de profil à 100 / 300 / 1000 / 3000 questions
(`practice-bronze`, `practice-silver`, `practice-gold`, `practice-diamond`), et le champ n'est
renseigné que sur la requête qui franchit le seuil.

`prompt` a exactement le format de `question.prompt` du WebSocket (`questionPromptSchema`,
exporté par `services/gameSchemas.ts`). Erreurs (`ApiError.code`) : `INVALID_TOKEN`,
`ACCOUNT_NOT_FOUND`, `SUBSCRIPTION_REQUIRED` (403, abonnement expiré), `INVALID_LEVEL`,
`PRACTICE_NOT_AVAILABLE` (404, notion absente du niveau).

## Data layer

- `services/practice.ts` : `fetchPracticeCatalog` (zod, puis filtre des niveaux et types de
  prompt inconnus du front : une notion sans rendu n'est jamais proposée),
  `fetchPracticeTimesTables` et `fetchPracticeQuestion(topic)` (l'URL dépend du `PracticeTopic` :
  chemin niveau/catégorie/notion, ou `/practice/times-tables/question` avec un paramètre
  `tables` répété).
- `hooks/usePractice.ts` : `usePracticeCatalog()` et `usePracticeTimesTables()`
  (`staleTime: Infinity`, données statiques), `usePracticeQuestion(series)` : une requête par question, clé
  `['practice-question', runId, index]`, et la question suivante est préchargée dès que la
  courante est arrivée (pendant que l'élève répond ou lit la correction). Un
  `SUBSCRIPTION_REQUIRED` invalide `['subscription-status']`.
- `lib/practice.ts` (pur, testé) : `resolvePracticeOptions` (catégories du niveau, notions de la
  catégorie, sélection automatique quand il n'y a qu'une notion, choix invalides ignorés),
  la série (`startSeries`, `answerQuestion`, `nextQuestion`, `isSeriesFinished`,
  `correctCount`), `ratePractice` (`perfect` / `great` ≥ 70 % / `good` ≥ 40 % / `keepGoing`),
  `SERIES_LENGTHS` (5, 10, 20 : 20 est le maximum), symboles de catégorie et encouragements.
  Temps optionnel : `TIME_LIMIT_MIN_SECONDS` (2), `TIME_LIMIT_MAX_SECONDS` (99),
  `DEFAULT_TIME_LIMIT_SECONDS` (10), `clampTimeLimit`. `toggleTable` (sélection triée).
  `PracticeSeries` porte `topic` et `timeLimitSeconds` (`null` = pas de limite, valeur par
  défaut) ; `pending` est un `PendingAnswer` (`answered` avec la réponse donnée, ou
  `timedOut`). `timeOutQuestion` marque la question comme expirée (sans effet si une réponse est
  déjà en attente) ; une question expirée compte comme incorrecte dans `outcomes`.
- `hooks/useCountdown.ts` : `useCountdown(durationSeconds, startTimeSeconds)` renvoie les
  secondes restantes (`null` sans durée), rafraîchies toutes les 250 ms ; partagé avec
  `GameView`. `components/CountdownBadge.tsx` affiche `{n}s` (rouge à 3 s ou moins, son `tick`
  quand `ticking`), partagé avec `GameView`.

## Icônes débloquées

`PracticeQuestion.unlockedIcon?: PlayerIcon` (mappé depuis `unlocked_icon`, `null`/absent →
`undefined`). `usePracticeQuestion(series, onIconUnlocked)` appelle le callback dès qu'une question
(courante ou préchargée) porte une icône : le déblocage a lieu à la requête, donc le toast peut
apparaître pendant la question précédente. `PracticePage` garde la liste des icônes débloquées
(dédoublonnées par `id`), invalide `MY_ICONS_QUERY_KEY` et rend `IconUnlockToast` au-dessus de
tous les écrans (configuration, série, résultat) : le toast reste affiché 10 s même quand la
question ou l'écran change.

## Écrans (`pages/PracticePage.tsx` orchestre)

- Garde : non connecté, `active !== true` ou `SUBSCRIPTION_REQUIRED` → `<Navigate to="/subscription">`.
  Précharge le modèle manuscrit si le mode de saisie est `handwriting`.
- `PracticeSetup` : choix du mode (par notion / tables). Notion : niveau (présélectionné sur
  `usePlayerProfile().data.level`), catégories en tuiles avec symbole, notions (étape masquée
  s'il n'y en a qu'une). Tables : `PracticeTablesPicker` (au moins une table). Puis longueur
  5/10/20 et `PracticeTimeLimit` (« Sans limite » par défaut, ou « Limité » avec un champ de
  secondes de 2 à 99 et boutons −/+, valeur conservée quand on désactive puis réactive la
  limite). En saisie manuscrite, un avertissement s'affiche sous 5 s
  (`practice.timeLimitHandwritingHint`). Les choix (mode, tables, temps) sont conservés dans
  `PracticePage` entre la configuration et la série. Un échec du chargement des tables
  n'affecte que ce parcours (`TimesTablesState` : erreur et « Réessayer » dans
  `PracticeTablesPicker`) ; seul un échec du catalogue affiche `PracticeCatalogError`.
- `PracticeRun` : barre de progression segmentée (neutre, sans bon/faux), `QuestionPrompt`
  et `AnswerInput` du jeu (remontés par question via `key`). Si `timeLimitSeconds` est défini,
  un `CountdownBadge` décompte chaque question ; à zéro, `onTimeOut` appelle `timeOutQuestion` :
  carte « Temps écoulé ! » (`practice.timedOutTitle`) avec la bonne réponse. Juste → « Bravo ! » (texte
  varié), Rushy champion, mini-confettis, passage automatique après 1,4 s ou bouton.
  Faux → carte calme (bordure ambre) : réponse donnée barrée, bonne réponse en vert, mot
  d'encouragement ; on avance quand on veut. « Arrêter la série » revient à la configuration.
- `PracticeResult` : note `x/n` en grand, une étoile par question, message selon
  `ratePractice`, confettis, « Rejouer cette notion » (nouveau `runId`) ou
  « Changer de notion » (retour à la configuration avec les choix conservés). En mode tables, les
  libellés deviennent « Rejouer ces tables » / « Changer de tables ». Le rejeu conserve sujet,
  longueur et temps limite.

## Points d'entrée (abonnés uniquement)

Bouton « S'entraîner » sur `HomePage` uniquement (pas dans le menu joueur), absent du DOM
si l'abonnement n'est pas actif. Avantage « Mode
entraînement » listé en premier dans `PERKS` de `/subscription`.

## i18n

`practice.*` (dont `timesTablesLabel_one/_other`, résolu par `resolvePracticeTopicLabel`,
`mode*`, `tables`, `tableOption`, `chooseTable`, `timeLimit*`, `timedOutTitle`, `replayTables`,
`changeTables`), `promptTypes.*` (libellé de chaque notion, résolu par
`resolvePromptTypeLabel` ; `isPromptType` s'appuie sur un `Record<PromptType, true>` donc un
nouveau type de prompt oublié casse `tsc`), `errors.api.PRACTICE_NOT_AVAILABLE`,
`home.practice*`, `subscription.perks.practice`, `icons.unlocked` / `icons.equip` (toast d'icône).

## Tests

`lib/practice.spec.ts`, `services/practice.spec.ts`, `components/practice/PracticeRun.spec.tsx`
(temps limité, verrou du bouton après un temps écoulé), `pages/PracticePage.spec.tsx` (garde,
configuration, série complète, relance, toast d'icône), `components/icons/IconUnlockToast.spec.tsx`, plus les cas de visibilité dans `Header.spec.tsx`
et `HomePage.spec.tsx`.
