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

The `AnswerInput` component and its port/adapter pattern: `KeyboardInput` (desktop) vs `HandwritingInput` (touch). Full details of the handwritten digit recognition pipeline (TensorFlow.js MNIST, stroke segmentation).
→ Read when: modifying answer input, adding an input mode, touching handwriting recognition.

### [auth.md](auth.md)

`AuthClient` (login, register, logout, automatic token refresh), `AuthContext`/`AuthProvider`, `AuthModal`. Authentication is optional — unauthenticated players can play but don't save their XP.
→ Read when: adding an authenticated API call, modifying the login flow, protecting a page.

### [player-profile.md](player-profile.md)

Profile page: display of school level, grade (Bronze → Diamond), segmented XP bar, game history, and promotion button.
→ Read when: adding a stat to the profile, modifying the grade/level system, touching history.

### [routing.md](routing.md)

Route structure (`AppLayout` vs `GameLayout`), role of `GamePage` as view orchestrator, navigation convention with state.
→ Read when: adding a page, modifying navigation, understanding how `GamePage` switches between views.

### [conventions.md](conventions.md)

TypeScript rules, port/adapter pattern, Tailwind styles, no comments policy, validation commands, tests.
→ Read before writing code to follow existing patterns.

---

## Key dependencies

| Package                             | Usage                         |
| ----------------------------------- | ----------------------------- |
| `react-router-dom` v7               | SPA routing                   |
| `@tensorflow/tfjs` v4               | Handwritten digit recognition |
| `canvas-confetti`                   | Podium animations             |
| `clsx` + `tailwind-merge`           | CSS class composition         |
| `zod` + `@tanstack/react-form`      | Form validation (AuthModal)   |
| `vitest` + `@testing-library/react` | Unit tests                    |
