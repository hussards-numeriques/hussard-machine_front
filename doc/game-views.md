# Game Views — The 3 game views

The three views are rendered by `GamePage` based on `game.state`. They all receive `client`, `game`, and `currentPlayerId` (= `client.getPlayerId()`).

## LobbyView (src/views/LobbyView.tsx)

**When:** `game.state === 'WAITING'` or `'COUNTDOWN'`

Displays the player list and action buttons.

### Key behaviors

- **Lobby code**: displayed prominently if `!game.is_quick_game`
- **Quick game**: shows "Quick Game" instead of the code
- **Ready/Not ready**: `client.setReady(!isReady)` — toggles the current player's state
- **Start**: visible only if `canStart && !game.is_quick_game`
  - `canStart` = `game.players.length >= 1 && game.players.every(p => p.is_ready)`
  - Quick games start automatically server-side
- **Launch countdown**: when `game.state === 'COUNTDOWN'`, `LaunchCountdownOverlay` (`src/components/LaunchCountdownOverlay.tsx`) covers the lobby with a calm, light screen (`bg-slate-50`): a static Rushy (`determine`, then `champion` on GO), a small « La partie commence » label, the number from the backend `COUNTDOWN` WS message (`Prêts ?` before the first tick, `5…1`, then `GO !`) in `text-primary` with a single short fade/scale-in (`animate-countdown-pop`, restarted via `key`, `motion-safe:` only), and the players' avatars with their names. The seconds come from `client.setLaunchCountdownCallback` (registered in an effect with cleanup) — no local timer.
- **No buttons during launch**: during `COUNTDOWN` the whole bottom action bar (ready toggle, `Quitter`, `Lancer la partie !`) is not rendered, so no `READY` can be sent.
- **Quitter**: shown only while `!isReady`; calls `onLeave` (wired to `GamePage.handleBackHome`) to return to the home screen. A ready player must first click "Je ne suis plus prêt" to reveal it.

### Props

```typescript
{
  client: GameClient;
  game: Game;
  currentPlayerId: string | null;
  onLeave: () => void;
}
```

---

## GameView (src/views/GameView.tsx)

**When:** `game.state === 'IN_PROGRESS'`

Displays the current question, timer, scoreboard, and input component.

### Question prompt (`src/components/QuestionPrompt/`)

The back sends `question.prompt`, a discriminated union on `type` (28 types, one per
pedagogical notion, contract `back/docs/i18n-api-contract.md` §1), validated in
`gameSchemas.ts`. `QuestionPrompt` switches exhaustively on `prompt.type` (the compiler
flags a missing case) and renders one dedicated component from `prompts.tsx` per type.
Text formatting is pure and unit-tested in `src/lib/mathFormat.ts`: French thousands
separators, true minus sign `−`, negative operands in parentheses unless leading, minimal
parentheses for expression trees, affine `ax + b` rules. Layout helpers: `Blank` (the
dashed `?` box), stacked `Fraction`, `<sup>` exponents, overlined `√`, French-style posed
Euclidean division, `<var>` for `x` and `f`; non-linear layouts expose an `sr-only`
reading. Font size is relative (`em`): `GameView` passes a viewport-clamped size,
`CorrectionCard` `text-3xl`. The category label comes from `resolveQuestionCategoryLabel`.

### Question index management

The server may increment `current_question_index` by 1 (normal progression) or skip several questions. The view maintains a local `displayedQuestionIndex` to avoid flashes:

- Advances only if `currentIndex === displayedIndex + 1` (normal progression)
- On skip (`currentIndex > displayedIndex + 1`), displays the new question directly and logs a warning

### Timer (`useQuestionTimer`)

Local hook that calculates remaining seconds from `question.time_limit_seconds` and `game.start_time_current_question` (Unix timestamp). Refreshes every 250ms.

When `questionCountdown !== null` (inter-question countdown active), the timer is paused.

### Inter-question countdown (`questionCountdown`)

`GameClient.onQuestionCountdown` is wired in a `useEffect`. When the server sends `QUESTION_COUNTDOWN { seconds: 0 }`, the countdown is cleared and the question is shown.

### Answer input

The `AnswerInput` component is disabled when the player has already answered the current question:

```typescript
const hasAnswered = game.answers.some(
  (a) => a.question_id === currentQuestion.id && a.player_id === currentPlayerId
);
```

### Feedback en jeu

Dérivé du `Game` (aucun appel backend dédié). Voir `src/lib/feedback.ts`.

- **À la soumission** (`AnswerFeedbackPop`) : remplace l'`AnswerInput` une fois que le joueur a répondu. Affiche `+points` (vert, `animate-pop-in`) ou `Raté` (rouge, `animate-shake`) + « En attente des autres joueurs… ». Ne révèle pas la bonne réponse.
- **Compte à rebours inter-question** (`CorrectionCard`) : remplace l'écran « Préparez-vous » dès la 2ᵉ question. Rappel du calcul, points gagnés et compte à rebours. En cas de bonne réponse, la valeur n'est pas réaffichée (redondante avec le calcul) ; en cas d'erreur/timeout, on montre `réponse donnée → bonne réponse` (rouge barré + vert, ou `⏱ Pas de réponse`).
- **Scoreboard** (`AnimatedScore`) : la valeur de score pulse à chaque hausse ; la barre conserve sa transition existante.

Composants : `src/components/GameFeedback/{AnswerFeedbackPop,CorrectionCard,AnimatedScore}.tsx`.

### Scoreboard

Sorted by descending score. The progress bar is relative to 1000 pts (visual max).

---

## PodiumView (src/views/PodiumView.tsx)

**When:** `game.state === 'FINISHED'`

Displays the podium (top 3 in columns), the action buttons, then the full rankings — in that DOM order, so "Rejouer" stays reachable without scrolling on mobile.

### Key behaviors

- **Confetti**: launched on mount via `canvas-confetti`
- **Play again**: creates a new `quickGame` and navigates to it passing `{ playerName, token }` in navigation state
- **Back home**: `navigate('/')`
- **Answer result dots**: in the full ranking only (not the top-3 columns), each player's score is followed by a row of small dots — one per question, in play order — showing `correct` (green) / `incorrect` (red) / `timeout` (grey), the shared `AnswerResult` vocabulary from `src/lib/playerAnswer.ts` (also used by the in-game `CorrectionCard` feedback). Derived purely from `game.answers` + `game.questions` via `getPlayerAnswerResults` (`src/lib/answerDots.ts`), itself built on `findPlayerAnswer` (`src/lib/playerAnswer.ts`); no extra network call. Rendered by `AnswerDots` (`src/components/AnswerDots.tsx`), built on the generic `Dot` component (`src/components/Dot.tsx`, 3 color variants: `success`/`danger`/`neutral`). Each dot carries an `aria-label` (`Correcte`/`Incorrecte`/`Sans réponse`, `role="img"`) so the result isn't conveyed by color alone; the row itself is `role="list"`. The dots row's width is capped at `<score text length>ch` so it never grows wider than the score above it, wrapping onto extra lines instead.
- **XP progress**: between the top-3 podium and the action buttons, `EndGameXpProgress`
  (`src/components/grade/`) shows the segmented XP bar animating from the pre-game to
  the post-game state (`useXpProgress`, mirrors the `useTitleUnlocks` snapshot/diff
  pattern), a `+X XP`/negative badge, and a gold glow + micro-confetti whenever a
  grade is crossed — including the crossing into the last grade (`DIAMOND`), which
  simultaneously turns `can_promote` on; there is no separate promotion notification.
  Identical for salon and quick games; a salon game always shows `+0 XP`. The card
  renders as soon as the pre-game (`before`) snapshot is known — showing a frozen,
  non-animated bar with no badge — instead of waiting for the post-game (`after`)
  snapshot to settle ~1.5s later, so it reserves its space immediately and the action
  buttons below it don't shift down once it animates in. The fill animation itself is
  triggered via a double-`requestAnimationFrame` (not a fixed delay), so the browser
  reliably paints the pre-animation frame before the CSS transition starts. It also
  takes an optional `level` prop (the current player's school level): when given, it's
  shown as a `PlayerLevel` pill next to the "Progression" heading, the same
  position/style pattern as the level pill on `/profile` next to the avatar. Only
  rendered when `xpProgress`/`config` are loaded, so an unauthenticated quick-game
  guest (no XP tracked) won't see it there.

### Props

```typescript
{
  game: Game;
  currentPlayerId: string | null;
  client: GameClient; // to create the new game via createQuickGame()
  playerName: string; // to join the new game
  xpProgress?: XpProgress | null;
}
```

---

## Player vitrine (grade + streak)

Each `Player` snapshot carries `level`, `grade`, `daily_streak` and `title` (set at game entry, immutable during the game — see the backend contract). Three shared components surface `grade`/`daily_streak`/`title`:

- `PlayerAvatar` (`src/components/PlayerAvatar.tsx`): the player's **rank badge**. The round face (initials, or `iconUrl` when given — only `ProfilePage` has it, the WS `Player` carries no icon) sits in a static metal ring colored by grade, and an optional `level` prop adds a small tab at the bottom of the ring showing the school level, painted in the same metal. The `title` attribute spells the whole rank (`CM2 · Or`). Metals are defined once per grade (`resolveGradeMetal` in `src/lib/grades.ts` → `.grade-metal-*` CSS variables in `src/index.css`, consumed by `.grade-ring` and `.grade-tab`); Platine/Diamond get a soft static glow. No animation on purpose: a rotating ring reads as a loading spinner. Sizes `sm | md | lg`. Bots get a slate face.
- `PlayerStreak` (`src/components/PlayerStreak.tsx`): the streak flame + count, or `null` when `daily_streak <= 0` (see `doc/streak.md`).
- `PlayerTitle` (`src/components/PlayerTitle.tsx`): the equipped title label colored by rarity, or `null` when `title === null` (see `doc/quests-titles.md`).

Wired into `LobbyView` (player cards) and `PodiumView` (full ranking). The podium's top-3 columns show only the player's name — no avatar, grade ring, streak, or title — to keep those columns uncluttered. **Not** shown in the in-game `GameView` scoreboard by design.

Layout rule for a player row: **left = rank** (avatar: grade ring + level tab), **right = identity** (name + streak on the first line, title on the second). `level` lives on the avatar tab (lobby, podium ranking, launch countdown, profile), which keeps the text column for the name and the title — titles are the app's flagship feature. `PlayerLevel` (slate pill) is only used in `EndGameXpProgress` (see above).

## Adding a UI element to a game view

1. Data exists in `Game` → read directly from `game`
2. Data comes from a new WS message → see [game-flow.md](game-flow.md) to add the callback
3. New game state → add to `GameState` (types.ts) and the `switch` in `GamePage`
4. New reusable component → place in `src/components/` with its interface in a `port.ts` if multiple implementations are possible
