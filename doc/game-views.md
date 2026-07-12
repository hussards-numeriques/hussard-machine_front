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
- **Countdown**: when `game.state === 'COUNTDOWN'`, the "Starting..." text animates
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

Displays the podium (top 3 in columns) and full rankings.

### Key behaviors

- **Confetti**: launched on mount via `canvas-confetti`
- **Play again**: creates a new `quickGame` and navigates to it passing `{ playerName, token }` in navigation state
- **Back home**: `navigate('/')`

### Props

```typescript
{
  game: Game;
  currentPlayerId: string | null;
  client: GameClient; // to create the new game via createQuickGame()
  playerName: string; // to join the new game
}
```

---

## Player vitrine (grade + streak)

Each `Player` snapshot carries `level`, `grade`, `daily_streak` and `title` (set at game entry, immutable during the game — see the backend contract). Three shared components surface them:

- `PlayerAvatar` (`src/components/PlayerAvatar.tsx`): the round initials avatar with a **grade-colored ring** (`resolveGradeRingColor` in `src/lib/grades.ts`), sizes `sm | md | lg`. Bots get a slate fill but still show their grade ring. The ring can be turned off with `showGradeRing={false}`.
- `PlayerStreak` (`src/components/PlayerStreak.tsx`): the streak flame + count, or `null` when `daily_streak <= 0` (see `doc/streak.md`).
- `PlayerTitle` (`src/components/PlayerTitle.tsx`): the equipped title label colored by rarity, or `null` when `title === null` (see `doc/quests-titles.md`).

Wired into `LobbyView` (player cards) and `PodiumView`. The podium's top-3 columns show only the player's name — no avatar, grade ring, streak, or title — to keep those columns uncluttered. `PlayerAvatar`/`PlayerStreak`/`PlayerTitle` are used only in the full-ranking list below. **Not** shown in the in-game `GameView` scoreboard by design. `level` is intentionally not displayed anywhere yet.

## Adding a UI element to a game view

1. Data exists in `Game` → read directly from `game`
2. Data comes from a new WS message → see [game-flow.md](game-flow.md) to add the callback
3. New game state → add to `GameState` (types.ts) and the `switch` in `GamePage`
4. New reusable component → place in `src/components/` with its interface in a `port.ts` if multiple implementations are possible
