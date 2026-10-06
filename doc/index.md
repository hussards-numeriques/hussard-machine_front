# Calc Rush — LLM Documentation

Calc Rush is a **multiplayer mental math** web application. Players join a lobby, answer math questions in real time, and are ranked by score. The frontend is built with React 19 + TypeScript + Tailwind CSS, connected to a backend via REST and WebSocket.

Production URL: `https://www.calc-rush.fr/`

---

## How to use this documentation

Identify the relevant feature below, read the corresponding file, then act.
To understand the general code organization (file tree, stack, data flow), start with [architecture.md](architecture.md).

---

## Feature index

### [architecture.md](architecture.md)

Tech stack, environment variables, full project file tree, and main data flow. **Starting point if you don't know the project.**

### [game-flow.md](game-flow.md)

Everything about the game lifecycle: game states (`WAITING → COUNTDOWN → IN_PROGRESS → FINISHED`), `GameClient` (WebSocket + REST), WS message protocol, `GameContext`.
→ Read when: adding a WS message, modifying start logic, touching the Game context.

### [game-views.md](game-views.md)

The three views rendered during a game: `LobbyView` (waiting lobby), `GameView` (question + timer + scoreboard), `PodiumView` (results + confetti).
→ Read when: modifying in-game display, adding a UI element to a game view.

### [answer-input.md](answer-input.md)

The `AnswerInput` component and its port/adapter pattern: `KeyboardInput` (desktop) vs `HandwritingInput` (touch, default) vs `KeypadInput`. Full details of the handwritten digit recognition pipeline (whole-number input, client-side ONNX CRNN via onnxruntime-web, model preloaded in the lobby).
→ Read when: modifying answer input, adding an input mode, touching handwriting recognition.

### [auth.md](auth.md)

`AuthClient` (login, register, logout, automatic token refresh), `AuthContext`/`AuthProvider`, `AuthModal`. Authentication is optional — unauthenticated players can play but don't save their XP.
→ Read when: adding an authenticated API call, modifying the login flow, protecting a page.

### [player-profile.md](player-profile.md)

Profile page: display of school level, grade (Bronze → Diamond), segmented XP bar, game history, and promotion button.
→ Read when: adding a stat to the profile, modifying the grade/level system, touching history.

### [streak.md](streak.md)

Daily streak: route `/me/streak`, hex port `services/streak` (`deriveStreakStatus`), `StreakProvider`/`useStreak`, and components `StreakBadge` / `StreakFlame` (evolving flame by tier) / `DailyQuestIcon`.
→ Read when: modifying the streak display, the tier thresholds, or reusing the flame icon elsewhere.

### [quests-titles.md](quests-titles.md)

Quêtes progressives et titres cosmétiques **par niveau scolaire** : route `/quests`
(sélecteur de niveau, niveau actuel actif / autres niveaux en lecture seule), service
hexagonal `services/quests` (`GET /quests`, `GET /me/titles?level=`, `PUT /me/selected-title`),
composants `PlayerTitle` / `QuestProgressCard` / `TitlesLevelBanner` / `TitleUnlockToast`,
texte titres de la modale de changement de niveau, et la détection de déblocage par diff au
niveau de la partie (`useTitleUnlocks`).
→ Read when: modifying quest/title display, thresholds, per-level titles, or the unlock-toast detection.

### [player-icons.md](player-icons.md)

Player profile icons: `GET /icons` (catalog), `GET /me/icons`, `PUT /me/selected-icon`,
the `selected_icon_url` field on `GET /me/details`, and the front-end `/icons` page
(picker, mirrors `/quests`) plus its display on the profile avatar.
→ Read when: displaying a player's profile icon, building an icon picker, or touching
`/me/details`'s response shape.

### [mascot.md](mascot.md)

Rushy, la mascotte (calculatrice speedy) : composant `<Mascot>` et ses 5 poses,
charte/anatomie, et le pipeline de génération des assets statiques (favicon, PWA,
bannière OG) via `npm run generate:icons`.
→ Read when: afficher la mascotte dans l'app, ajouter une pose, ou régénérer les icônes.

### [mobile.md](mobile.md)

Android app (Capacitor): `mobileandroid/` native project, `build:mobile` / `cap:sync` / `apk` scripts, and how native code (`NativeAppBridge`, `PushRegistration`, `@capacitor/*`) is kept out of the web bundle.
→ Read when: touching native features, the mobile build, or anything imported from `@capacitor/*`.

### [routing.md](routing.md)

Route structure (`AppLayout` vs `GameLayout`), role of `GamePage` as view orchestrator, navigation convention with state.
→ Read when: adding a page, modifying navigation, understanding how `GamePage` switches between views.

### [subscription.md](subscription.md)

Achat d'abonnement Stripe Checkout (1/3/12 mois, achat unique), pages de retour
succès/annulation, offre « Calc Rush+ » (page orientée bénéfices), couronne + carte du menu joueur dans le header, et bandeau de pause sur `/quests` quand inactif.
→ Read when: touching `/subscription*` routes, checkout, or the quests pause
banner.

### [conventions.md](conventions.md)

TypeScript rules, port/adapter pattern, Tailwind styles **(graphic charter: page card patterns, typography, color tokens)**, no comments policy, validation commands, tests.
→ Read before writing code to follow existing patterns, especially before creating a new page (pick the right card pattern).

---

## Key dependencies

| Package                             | Usage                         |
| ----------------------------------- | ----------------------------- |
| `react-router-dom` v7               | SPA routing                   |
| `onnxruntime-web` v1                | Handwritten digit recognition |
| `canvas-confetti`                   | Podium animations             |
| `clsx` + `tailwind-merge`           | CSS class composition         |
| `zod` + `@tanstack/react-form`      | Form validation (AuthModal)   |
| `vitest` + `@testing-library/react` | Unit tests                    |
