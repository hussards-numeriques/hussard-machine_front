# Calc Rush Front

## [Unreleased]

### Added

- Answer input: a new on-screen numeric **keypad** mode (`KeypadInput`, telephone layout) joins keyboard and handwriting, and a new `/settings` page (linked from the header user menu) lets a signed-in player choose their answer-input mode — Automatique / Clavier / Écriture manuscrite / Pavé numérique. The choice is persisted per-device in `localStorage` (`useAnswerInputMode`), defaulting to `auto` (the prior adaptive behavior: handwriting on touch, keyboard otherwise). The resolution logic is now a pure function (`resolveAnswerInputMode` in `mode.ts`) and the device-specific components are selected from a lookup map (`ANSWER_INPUT_COMPONENTS`), resolved reactively on every render instead of once at import.
- Quests & titles: players unlock cosmetic titles (`BRONZE`/`SILVER`/`GOLD`/`DIAMOND` rarities) by progressing through quests, and can equip one from a new `/quests` page (linked from the header user menu). The equipped title is snapshotted per-player at `JOIN` (like `level`/`grade`/`daily_streak`) and shown in the lobby and the podium's full ranking (not the top-3 columns). No WS event fires on unlock; the podium detects new titles by diffing `GET /me/titles` against a lobby-time snapshot and shows an auto-dismissing toast (`useTitleUnlocks`, `TitleUnlockToast`).

### Fixed

- Layout chrome: the home-page footer now rests at the bottom of the viewport instead of falling below the fold — `AppLayout` became a flex column with the `<Outlet />` wrapped in a `<main class="flex-1">` between the header and the (home-only) footer, and `HomePage` fills that space (`flex-1`) instead of forcing its own `min-h-screen`. During a game, `GameView` no longer reserves a 4rem empty strip at the top (`pt-16`, a leftover slot for a fixed header that `GameLayout` never renders): the "Question X / Y" bar becomes a full-width `sticky top-0` header and gains a thin progress bar showing how far into the game the player is.

## [0.12.1] - 2026-07-10

### Changed

- On the final podium, the grade-colored ring around avatars now appears only in the "Classement complet" list; the top-3 columns no longer show it, removing the visual duplication. `PlayerAvatar` gains a `showGradeRing` prop (default `true`) to opt out.

## [0.12.0] - 2026-07-10

### Added

- Player vitrine during a game: each player now shows a **grade-colored ring** around its avatar (League-of-Legends style) and its **daily-streak flame + count**. Driven by three new per-player fields (`level`, `grade`, `daily_streak`) snapshotted at game entry by the backend and validated in `playerSchema`. Wired into the lobby (`LobbyView`) and the final podium (`PodiumView` — top-3 columns + full ranking); bots display their (default bronze) ring too. New shared components `PlayerAvatar` and `PlayerStreak` (reusing `StreakFlame`), plus `resolveGradeRingColor` in `lib/grades`. `level` is captured but not displayed yet (reserved for future cross-level rules), and the in-game scoreboard is intentionally left unchanged.

## [0.11.3] - 2026-07-07

### Changed

- The "Aide & FAQ" page (grades + streaks guides) is renamed **"Progression & récompenses"** — the old title matched neither an FAQ nor help content. Its route moves from `/how-it-works` to `/progression` and the component `HowItWorksPage` becomes `ProgressionPage`. The profile link label follows suit.

### Removed

- Redundant "Retour à l'accueil" buttons at the bottom of the legal pages (`TermsPage`, `TermsOfSalePage`, `LegalNoticePage`, `PrivacyPolicyPage`) and the profile page: the header already exposes a "← Accueil" link on every non-home route.

## [0.11.2] - 2026-07-07

### Changed

- In-game inter-question recap (`CorrectionCard`): a correct answer no longer repeats the answer value (redundant with the statement) — only the statement, earned points, and countdown are shown. Wrong/timeout still display `given → expected`.

### Removed

- The in-game consecutive-correct-answer combo (`ComboBadge` + `computeCombo`), which was purely cosmetic and duplicated the daily streak shown on the home screen (computed by the backend). The `combo-grow` keyframe/animation was renamed `score-pulse`, its only remaining use being the score bump in `AnimatedScore`.

## [0.11.1] - 2026-07-07

### Added

- Lobby: a "Quitter" button lets a player leave the waiting room and return home. It appears only while the player is not ready (a ready player must first click "Je ne suis plus prêt"), sits next to "Je suis prêt !", and returns to the home screen with no confirmation. Leaving closes the WebSocket via `GamePage`'s existing cleanup; no dedicated leave message is sent.

## [0.11.0] - 2026-07-07

### Changed

- No more guest flash on load for logged-in players: `AuthProvider` now renders optimistically from a cached profile (`hm_auth_user`, zod-validated) and validates the session in the background.
- Sliding 7-day session: the app proactively calls `/auth/refresh` on every load (token rotation resets the 7-day expiry), so regular players stay logged in indefinitely.
- Logout-on-error is now reserved for confirmed 401s: network failures or fastauth downtime no longer clear tokens. A refresh that loses a multi-tab rotation race adopts the winning tab's tokens instead of logging everyone out.

## [0.10.0] - 2026-07-05

### Changed

- Migrated to the backend's unique `WS /ws/play` endpoint, replacing the per-game `WS /ws/game/{game_id}`. `GameClient.connect()` is replaced by two strictly-typed entry points: `connectToLobby({ gameId, playerName, token })` (private lobby by code — the only path that ever sends `game_id`) and `connectToQuickGame({ playerName, token })` (quick game / resume — the only path that ever sends `player_id`). The two are mutually exclusive at the type level (`JoinPayload` discriminated union in `GameClient.ts`).
- `POST /quick-games` is removed; quick games are now created/resumed entirely through the `JOIN` WebSocket message. `HomePage`'s "Partie Rapide" and `PodiumView`'s "Rejouer" now navigate straight to `/game` (no id) instead of calling REST first.
- The game route is now `game/:gameId?` (optional): a private lobby keeps its code in the URL, a quick game/resume has none — `GamePage` picks the right `connect*` method based on whether `gameId` is present.
- Guest players are recognized across reconnects via a `player_id` persisted in `localStorage` (`hm_guest_player_id`); authenticated players are recognized via their `token` alone and never touch this storage.
- `Player.is_connected` (new field, reflecting real-time connection status even mid-game) is now displayed: `LobbyView` and `GameView`'s scoreboard grey out disconnected players instead of assuming they vanished.

### Fixed

- `GameView`: accept an explicit `null` for `start_time_current_question` (the backend sends `null`, not omission, while a question hasn't started).
- `GamePage`'s connect effect now also depends on `location.key`, so "Rejouer" after a quick game (which reuses the `/game` path) actually reconnects instead of silently doing nothing.

## [0.9.0] - 2026-07-05

### Changed

- REST data fetching migrated to TanStack Query (`useGameConfig`, `usePlayerProfile`, `usePromotePlayer`): caching, deduplication, retries and loading/error states are no longer hand-rolled with `useEffect`/`useState`.
- Every HTTP/WebSocket payload entering the app is now validated with a zod schema at the service boundary (`services/gameSchemas.ts`, `services/profile.ts`, `services/gameConfig.ts`); malformed WS messages are logged and dropped instead of crashing.
- API/WS base URL resolution centralized in `services/apiConfig.ts`; grade/level labels, styles and XP-bar math centralized in `lib/grades.ts` and `lib/gradeProgress.ts` (previously duplicated inline in `ProfilePage`).
- `GameClient.connect()` now detaches handlers and closes any previous socket via a new `disconnect()` method before opening a new one.
- Documented the resulting conventions (discriminated unions, TanStack Query boundaries, service/zod boundary) in `CLAUDE.md` and `doc/conventions.md`.

## [0.8.1] - 2026-06-28

### Fixed

- Podium: truncate long player names to one line to prevent overflow onto the title.

## [0.8.0] - 2026-06-27

### Added

- Rushy mascot (speedy calculator): reusable `<Mascot>` component (5 poses).
- New icon set generated from the component: SVG + ICO favicon, PWA icons 192/512 + maskable, OG social banner 1200×630.

### Changed

- `index.html` and `manifest.json` rewired to the new assets.

### Removed

- Old generic `public/icon.png`.

## [0.7.0] - 2026-06-26

- Add a "Continuer avec Google" button to the auth modal: it redirects to the FastAuth backend OAuth2 flow, and after Google consent the backend redirects back to a new `/auth/callback` route with the tokens in the URL fragment; `OAuthCallbackPage` stores them, reloads the user and returns home. The username defaults to the Google first name.

## [0.6.2] - 2026-06-23

- Make the streak badge's `secured` daily-quest icon clickable like the other states, opening a popover with a live `HH:MM:SS` countdown to the next quest reset (assumed 00:00 UTC, since the backend doesn't expose a precise reset time)

## [0.6.1] - 2026-06-22

- Turn `/how-it-works` into a help/FAQ page assembling two explanatory components: `GradeGuide` (XP, grades, levels — extracted from the page) and a new `StreakGuide` explaining daily streaks (principle, tier thresholds with their evolving flame icons, the daily-quest states, and the freeze / last-chance safety net)
- Retitle the page "Aide & FAQ" and update the profile link accordingly

## [0.6.0] - 2026-06-22

- Daily streak badge in the header (authenticated users): current count, evolving flame icon by tier (ember → orange → amber → blue → violet → gold), and a daily-quest icon reflecting whether today is secured, at risk, or last chance before the streak breaks
- Risk popover on the daily-quest icon explaining the freeze safety net cooldown
- `GET /me/streak` integration via a new hexagonal `services/streak` port/adapter and `StreakProvider`/`useStreak` context, mounted inside `AuthProvider` in both layouts

## [0.5.5] - 2026-06-21

- Move the footer copyright notice to its own line below the links for better readability

## [0.5.4] - 2026-06-21

- Fix Vercel 404 on SPA deep links (e.g. reloading `/game/:gameId`): add a `vercel.json` rewrite serving `index.html` so the app boots and React Router handles the route — a game URL without navigation state then redirects to `/`
- Catch-all route redirecting any unmatched path to `/`

## [0.5.3] - 2026-06-19

- Terms of sale page (`/terms-of-sale`, "page en construction" placeholder, same pattern as `/terms`), linked from the footer

## [0.5.2] - 2026-06-19

- Legal notice (`/legal-notice`) and privacy policy (`/privacy-policy`) pages, linked from the footer
- Document the graphic charter (page card patterns, typography) in `doc/conventions.md`

## [0.5.1] - 2026-06-19

- Discreet footer on the home page only: copyright notice and a link to the external contact page

## [0.5.0] - 2026-06-19

- In-game feedback after each answer: on submit, a `+points` (green) or `Raté` (red) pop briefly appears then fades, without revealing the correct answer, leaving a "waiting for other players" state
- Correction card during the inter-question countdown: the calculation, the given answer (green when correct, or red strikethrough with the expected answer in green), points earned, and a combo badge
- Combo badge (`🔥 xN`) for consecutive correct answers (visual only, no scoring impact)
- Animated score in the scoreboard (pulses on increase)

## [0.4.4] - 2026-06-18

- Restyle the end-of-game `PodiumView` to follow the light theme charter (consistent with Lobby/Game views) instead of the standalone dark background

## [0.4.3] - 2026-06-18

- Remove "Effacer" button in mobile handwriting input, replace it with "Valider" so all controls fit on one row
- Remove unsolicited WS disconnect error toast and debug logging

## [0.4.2] - 2026-06-04

- Fix handwriting recognition (was failing 100% on a dead external model URL)
- Switch digit recognition to client-side `onnxruntime-web` with a bundled MNIST model (`public/models/mnist-12.onnx`) — no external dependency, works offline
- Rework `HandwritingInput` to digit-by-digit input (sign ±, backspace, debounced recognition), removing fragile multi-digit stroke segmentation
- Remove `@tensorflow/tfjs` dependency

## [0.4.1] - 2026-06-03

- Translate all documentation and changelog entries to English

## [0.4.0] - 2026-06-03

- Handwriting input on mobile via digit recognition (TensorFlow.js MNIST)
- Port/adapter pattern: `HandwritingInput` (touch) and `KeyboardInput` (desktop)

## [0.2.0] - 2026-04-21

- Change app name from "Hussard Machine" to "Calc Rush"

## [0.1.0] - 2026-04-18

- Profile page (`/profile`): displays level, grade, XP bar and last 10 games history from `GET /me/details`
- New types `PlayerProfile` and `GameHistoryEntry` in `types.ts`

## [0.0.1] - 2025-12-01

- Initial release
