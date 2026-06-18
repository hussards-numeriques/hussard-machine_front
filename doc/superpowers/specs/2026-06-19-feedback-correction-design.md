# Feedback de correction & juice en jeu — Design

## Objectif

Offrir l'expérience UI/UX la plus stimulante possible pour un jeu de calcul mental
compétitif, en donnant au joueur un retour clair et gratifiant à chaque question :
bonus de points animé, correction lisible (bonne/mauvaise réponse + rappel du calcul),
et combo de bonnes réponses consécutives pour donner envie de continuer.

Inspiration : Duolingo (micro-célébrations), adapté à un contexte compétitif.

## Contraintes & constats

- **Front-only, aucune modification backend.** Toutes les données nécessaires sont déjà
  dans le `Game` reçu par WebSocket : `Answer.points_earned`, `Answer.is_correct`,
  `Answer.value`, et `Question.answer`.
- **Aucune nouvelle dépendance.** Animations via keyframes Tailwind/CSS. `canvas-confetti`
  (déjà présent) n'est pas utilisé pour cette V1.
- Charte existante : police Nunito, `primary` indigo `#4f46e5`, `secondary` amber `#fbbf24`,
  `red-500` pour l'échec, vert pour le succès.

### Timing du cycle de jeu (backend, observé dans `run_game_loop`)

Par question N : `QUESTION_COUNTDOWN 3→0` → question affichée → fenêtre de réponse
(`time_limit_seconds`) + pause 2 s → `QUESTION_COUNTDOWN 3→0` de N+1…

**Point clé :** pendant le compte à rebours de la question N+1, `current_question_index`
vaut encore N (le `next_question` se déclenche après le compte à rebours). L'écran de
compte à rebours dispose donc déjà de la question N et de la réponse du joueur → c'est la
fenêtre de reveal.

## Décisions

| Sujet             | Décision                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| Modèle de reveal  | **2 temps** : pop privé sur soumission + correction complète au compte à rebours inter-question |
| Éléments de juice | **Combo/série** (🔥 xN) + **barre de score animée**. Pas de confetti, pas de son.               |
| Combo             | **Purement visuel** (n'influence pas le score → 0 backend)                                      |
| Fenêtre de reveal | **V1 = les 3 s du compte à rebours** (à réévaluer en playtest)                                  |

## Flux UX

### Stage 1 — sur la soumission du joueur (question encore affichée)

- Détection de la transition « le joueur vient de répondre ».
- Overlay transitoire : `+135 ✨` (vert, animation pop) si correct, ou `Raté` (rouge,
  secousse) si faux.
- **Ne révèle pas la bonne réponse** (préserve l'intérêt compétitif).

### Stage 2 — pendant le compte à rebours inter-question (remplace « Préparez-vous »)

- Carte de correction de la question qui vient de se terminer :
  - Rappel du calcul (`statement`).
  - Réponse donnée : en **vert** si correcte ; en **rouge barré** si fausse, suivie de la
    bonne réponse en **vert**.
  - Points gagnés (`+135`).
  - Badge combo.
- Indicateur de compte à rebours discret (anneau/chiffre) au lieu du gros chiffre actuel.

### Cas limites

- **Timeout / pas de réponse** : carte affiche `⏱ Pas de réponse` + bonne réponse en vert ;
  combo remis à 0.
- **1ère question** : pas de correction à montrer → garder « Préparez-vous » au 1er
  compte à rebours.
- **Combo** : nombre de bonnes réponses consécutives du joueur courant, remis à 0 sur
  faux ou timeout.

## Architecture (composants & unités)

Tout est dérivé du `Game` déjà reçu.

### Fonctions pures (`src/lib/`)

- `computeFeedback(game, playerId, questionIndex)` →
  `{ status: 'correct' | 'wrong' | 'timeout', given?: number, expected: number, pointsEarned: number }`
- `computeCombo(game, playerId, uptoIndex)` → `number` (bonnes réponses consécutives se
  terminant à `uptoIndex`)

### Hooks

- `useAnswerPop(game, playerId, currentQuestion)` → détecte la nouvelle réponse du joueur
  (transition `hasAnswered` false→true) et expose l'état du pop transitoire (stage 1),
  incluant `points_earned` et `is_correct`, sans la bonne réponse.

### Composants

- `AnswerFeedbackPop` — overlay `+X` / `Raté` (stage 1).
- `CorrectionCard` — carte de correction (stage 2) ; consomme `computeFeedback` et
  `computeCombo`.
- `ComboBadge` — `🔥 xN` avec animation de grossissement/vibration.
- Scoreboard existant **augmenté** : count-up de la valeur de score + transition de barre
  (`transition-all` déjà présent).

### Intégration dans `GameView`

- Branche `questionCountdown !== null` : si une question précédente répondable existe →
  afficher `CorrectionCard` + indicateur de compte à rebours discret ; sinon (1ère
  question) → garder l'écran « Préparez-vous » actuel.
- Branche question active : monter `AnswerFeedbackPop` piloté par `useAnswerPop`.

## Animations & charte

- Keyframes ajoutées à `tailwind.config.js` : `pop-in` (apparition + léger rebond),
  `shake` (échec), `combo-grow` (combo qui grossit/vibre).
- Couleurs : vert succès, `red-500` échec, `primary` indigo, `secondary` amber (combo).

## Hors scope (notes pour plus tard)

- Combo donnant un **bonus de points** réel (nécessiterait de modifier le `ScoringStrategy`
  backend et rééquilibrer le jeu).
- Confetti / feedback sonore.
- Fenêtre de reveal allongée : afficher la correction dès que le timer local atteint 0
  (option 2), ou ajouter une phase backend `REVEAL` dédiée (option 3) si les 3 s
  paraissent trop courtes en playtest.
- Fuite de `question.answer` dans le payload WS avant la fin de la question (triche
  possible) — sujet backend distinct.

## Critères de succès

- Sur bonne réponse : pop `+points` vert visible immédiatement après soumission.
- Sur le compte à rebours suivant : correction lisible avec calcul, réponse donnée
  (vert/rouge barré) et bonne réponse (vert).
- Combo visible et incrémenté sur bonnes réponses consécutives, remis à 0 sinon.
- Barre de score animée à la hausse.
- `./scripts/validate.sh` passe (lint, prettier, tsc, tests).
- Fonctions pures `computeFeedback` / `computeCombo` couvertes par des tests.

## Mise à jour de la doc

Conformément au protocole du `CLAUDE.md` front : mettre à jour `doc/` après les changements
(via `doc/index.md`). Au minimum, documenter le flux de feedback/correction en jeu et les
nouveaux composants (`AnswerFeedbackPop`, `CorrectionCard`, `ComboBadge`) là où la doc
décrit le déroulé d'une partie côté front.
