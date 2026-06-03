# Calc Rush — Documentation LLM

Calc Rush est une application web de **calcul mental multijoueur**. Les joueurs rejoignent un salon, répondent à des questions de maths en temps réel, et sont classés par score. Le frontend est en React 19 + TypeScript + Tailwind CSS, connecté à un backend via REST et WebSocket.

URL de production : `https://www.calc-rush.fr/`

---

## Comment utiliser cette documentation

Identifie la feature concernée ci-dessous, lis le fichier correspondant, puis agis.
Pour comprendre l'organisation générale du code (arborescence, stack, flux de données), commence par [architecture.md](architecture.md).

---

## Index des features

### [architecture.md](architecture.md)

Stack technique, variables d'environnement, arborescence complète du projet et flux de données principal. **Point de départ si tu ne connais pas le projet.**

### [game-flow.md](game-flow.md)

Tout ce qui concerne le cycle de vie d'une partie : états du jeu (`WAITING → COUNTDOWN → IN_PROGRESS → FINISHED`), `GameClient` (WebSocket + REST), protocole de messages WS, `GameContext`.
→ À lire pour : ajouter un message WS, modifier la logique de démarrage, toucher au contexte Game.

### [game-views.md](game-views.md)

Les trois vues rendues pendant une partie : `LobbyView` (salon d'attente), `GameView` (question + timer + scoreboard), `PodiumView` (résultats + confettis).
→ À lire pour : modifier l'affichage pendant la partie, ajouter un élément UI à une vue de jeu.

### [answer-input.md](answer-input.md)

Le composant `AnswerInput` et son pattern port/adapter : `KeyboardInput` (desktop) vs `HandwritingInput` (tactile). Détail complet du pipeline de reconnaissance de chiffres manuscrits (TensorFlow.js MNIST, segmentation des traits).
→ À lire pour : modifier la saisie de réponse, ajouter un mode de saisie, toucher à la reconnaissance manuscrite.

### [auth.md](auth.md)

`AuthClient` (login, register, logout, refresh token automatique), `AuthContext`/`AuthProvider`, `AuthModal`. L'authentification est optionnelle — les joueurs non connectés peuvent jouer mais ne sauvegardent pas leur XP.
→ À lire pour : ajouter un appel API authentifié, modifier le flux de connexion, protéger une page.

### [player-profile.md](player-profile.md)

Page profil : affichage du niveau scolaire, du grade (Bronze → Diamant), de la barre XP segmentée, de l'historique des parties, et du bouton de promotion.
→ À lire pour : ajouter une stat au profil, modifier le système de grades/niveaux, toucher à l'historique.

### [routing.md](routing.md)

Structure des routes (`AppLayout` vs `GameLayout`), rôle de `GamePage` comme orchestrateur des vues, convention de navigation avec state.
→ À lire pour : ajouter une page, modifier la navigation, comprendre comment `GamePage` passe d'une vue à l'autre.

### [conventions.md](conventions.md)

Règles TypeScript, pattern port/adapter, styles Tailwind, absence de commentaires, commandes de validation, tests.
→ À lire avant d'écrire du code pour respecter les patterns existants.

---

## Dépendances clés

| Package                             | Usage                                 |
| ----------------------------------- | ------------------------------------- |
| `react-router-dom` v7               | Routing SPA                           |
| `@tensorflow/tfjs` v4               | Reconnaissance de chiffres manuscrits |
| `canvas-confetti`                   | Animations podium                     |
| `clsx` + `tailwind-merge`           | Composition de classes CSS            |
| `zod` + `@tanstack/react-form`      | Validation de formulaires (AuthModal) |
| `vitest` + `@testing-library/react` | Tests unitaires                       |
