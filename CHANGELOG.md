# Calc Rush Front

## [Unreleased]

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
