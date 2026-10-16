# Mode entraînement (`/practice`)

Réservé aux abonnés **Calc Rush+**. L'élève choisit un niveau, une catégorie et une notion
(un type de prompt), puis enchaîne une série de 5, 10 ou 20 questions : pas de chrono, pas
d'adversaire, pas de score pendant la série. Toute la boucle est gérée côté front.

## Backend contract

| Route                                            | Auth   | Réponse                                                 |
| ------------------------------------------------ | ------ | ------------------------------------------------------- |
| `GET /practice/catalog`                          | Bearer | `{ [Level]: { [category]: promptType[] } }` (statique)  |
| `GET /practice/{level}/{category}/{prompt_type}` | Bearer | `{ prompt, answer }` : une question aléatoire par appel |

`prompt` a exactement le format de `question.prompt` du WebSocket (`questionPromptSchema`,
exporté par `services/gameSchemas.ts`). Erreurs (`ApiError.code`) : `INVALID_TOKEN`,
`ACCOUNT_NOT_FOUND`, `SUBSCRIPTION_REQUIRED` (403, abonnement expiré), `INVALID_LEVEL`,
`PRACTICE_NOT_AVAILABLE` (404, notion absente du niveau).

## Data layer

- `services/practice.ts` : `fetchPracticeCatalog` (zod, puis filtre des niveaux et types de
  prompt inconnus du front : une notion sans rendu n'est jamais proposée) et
  `fetchPracticeQuestion`.
- `hooks/usePractice.ts` : `usePracticeCatalog()` (`staleTime: Infinity`, catalogue statique),
  `usePracticeQuestion(series)` : une requête par question, clé
  `['practice-question', runId, index]`, et la question suivante est préchargée dès que la
  courante est arrivée (pendant que l'élève répond ou lit la correction). Un
  `SUBSCRIPTION_REQUIRED` invalide `['subscription-status']`.
- `lib/practice.ts` (pur, testé) : `resolvePracticeOptions` (catégories du niveau, notions de la
  catégorie, sélection automatique quand il n'y a qu'une notion, choix invalides ignorés),
  la série (`startSeries`, `answerQuestion`, `nextQuestion`, `isSeriesFinished`,
  `correctCount`), `ratePractice` (`perfect` / `great` ≥ 70 % / `good` ≥ 40 % / `keepGoing`),
  `SERIES_LENGTHS` (5, 10, 20 : 20 est le maximum), symboles de catégorie et encouragements.

## Écrans (`pages/PracticePage.tsx` orchestre)

- Garde : non connecté, `active !== true` ou `SUBSCRIPTION_REQUIRED` → `<Navigate to="/subscription">`.
  Précharge le modèle manuscrit si le mode de saisie est `handwriting`.
- `PracticeSetup` : niveau (présélectionné sur `usePlayerProfile().data.level`), catégories
  en tuiles avec symbole, notions (étape masquée s'il n'y en a qu'une), longueur 5/10/20.
- `PracticeRun` : barre de progression segmentée (neutre, sans bon/faux), `QuestionPrompt`
  et `AnswerInput` du jeu (remontés par question via `key`). Juste → « Bravo ! » (texte
  varié), Rushy champion, mini-confettis, passage automatique après 1,4 s ou bouton.
  Faux → carte calme (bordure ambre) : réponse donnée barrée, bonne réponse en vert, mot
  d'encouragement ; on avance quand on veut. « Arrêter la série » revient à la configuration.
- `PracticeResult` : note `x/n` en grand, une étoile par question, message selon
  `ratePractice`, confettis, « Rejouer cette notion » (nouveau `runId`) ou
  « Changer de notion » (retour à la configuration avec les choix conservés).

## Points d'entrée (abonnés uniquement)

Bouton « S'entraîner » sur `HomePage` et lien « Entraînement » en tête du menu joueur
(`Header`), tous deux absents du DOM si l'abonnement n'est pas actif. Avantage « Mode
entraînement » listé en premier dans `PERKS` de `/subscription`.

## i18n

`practice.*`, `promptTypes.*` (libellé de chaque notion, résolu par
`resolvePromptTypeLabel` ; `isPromptType` s'appuie sur un `Record<PromptType, true>` donc un
nouveau type de prompt oublié casse `tsc`), `errors.api.PRACTICE_NOT_AVAILABLE`,
`header.practice`, `home.practice*`, `subscription.perks.practice`.

## Tests

`lib/practice.spec.ts`, `services/practice.spec.ts`, `pages/PracticePage.spec.tsx` (garde,
configuration, série complète, relance), plus les cas de visibilité dans `Header.spec.tsx`
et `HomePage.spec.tsx`.
