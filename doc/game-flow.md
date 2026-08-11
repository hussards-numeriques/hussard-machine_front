# Game Flow — Game lifecycle

## Game states

```typescript
// src/types.ts
const GameState = {
  WAITING: 'WAITING', // lobby open, players joining
  COUNTDOWN: 'COUNTDOWN', // countdown before start (shown in LobbyView)
  IN_PROGRESS: 'IN_PROGRESS', // game in progress
  FINISHED: 'FINISHED', // game over, podium shown
};
```

`GamePage` reads `game.state` and renders the corresponding view. See [routing.md](routing.md) for details.

## GameClient (src/services/GameClient.ts)

Class encapsulating the WebSocket connection and REST calls for game creation.

### REST calls

| Method          | Endpoint            | Description                                                                                                                                                                                                                                                 |
| --------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createLobby()` | `POST /api/lobbies` | Creates a private multiplayer lobby, returns `game_id` (the join code). Requires a Bearer `token` (authenticated players only) and a body `{ level, max_players }` — the creator picks both up front instead of the level being guessed from whoever joins. |

There is no REST call to start a quick game — it's created (or resumed) entirely through the
`JOIN` WebSocket message below.

### WebSocket connection

All game traffic goes through a single, unique endpoint: `ws://{host}/ws/play`. Which game a
player ends up in is decided by which `connect*` method is called and what it sends in `JOIN`,
never by the URL:

```typescript
client.connectToLobby({ gameId, playerName, token? })
// → opens ws://{host}/ws/play, sends JOIN { name, token, game_id: gameId }
// → used only to join a private lobby by its code, for the very first time joining it

client.connectToQuickGame({ playerName, token? })
// → opens ws://{host}/ws/play, sends JOIN { name, token, player_id }
// → used for quick games and for resuming ANY unfinished game (quick or private lobby):
//   the backend picks the player's non-finished game if any, else a WAITING quick game,
//   else creates a new quick game. Never send game_id here.

client.disconnect()
// → detaches handlers and closes the socket (called by GamePage's effect cleanup)
```

`game_id` and `player_id` are mutually exclusive on the wire (enforced by the `JoinPayload`
discriminated union in `GameClient.ts`) — a `JOIN` never carries both.

`player_id` matters only for guests (no `token`): `GameClient` reads it from `localStorage`
(`hm_guest_player_id`) before sending `connectToQuickGame`, and persists whatever value comes back
in the next `PLAYER_JOINED` — this is how the backend recognizes a returning guest across
reconnects. Authenticated players are recognized via `token` alone; `GameClient` never reads or
writes the guest `player_id` when a `token` is present. The in-memory player id used by
`getPlayerId()` (see below) is unrelated to this persistence and is always updated on
`PLAYER_JOINED`, guest or not.

The optional JWT token links the game session to an authenticated account (for XP).

Incoming messages are validated with zod (`serverMessageSchema` in `src/services/gameSchemas.ts`,
a discriminated union on `type`); malformed messages are logged and dropped. Outgoing messages
are typed by the `ClientMessage` union in `GameClient.ts`.

### Incoming WebSocket messages

| Type                 | Payload               | Action                                                                                                                                                                                                                                                  |
| -------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PLAYER_JOINED`      | `{ player_id, game }` | Stores `playerId`, calls `onGameUpdate(game)`                                                                                                                                                                                                           |
| `GAME_UPDATE`        | `Game`                | Calls `onGameUpdate(game)`                                                                                                                                                                                                                              |
| `COUNTDOWN`          | `{ seconds }`         | Console log (not used by UI)                                                                                                                                                                                                                            |
| `QUESTION_COUNTDOWN` | `{ seconds }`         | Calls `onQuestionCountdown(seconds)` if defined                                                                                                                                                                                                         |
| `ERROR`              | `string`              | Calls `onError(message)`                                                                                                                                                                                                                                |
| `KICKED`             | `{}`                  | Calls `onError('Tu as été exclu du salon.')` — routed through the same `onError` flow as `ERROR`, no dedicated UI surface. Sent to a player the host removes via `removePlayer()`; `GamePage` renders it in its generic error card (see below).         |
| `LOBBY_CLOSED`       | `{}`                  | Calls `onError("L'hôte a quitté la partie, le salon a été fermé.")` — same `onError` flow, no dedicated UI surface. Sent to every other human still in a private lobby when its host disconnects before the game starts (the backend deletes the game). |

### Outgoing WebSocket messages

| Method                   | Message sent                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `setReady(isReady)`      | `READY { is_ready }`                                                                                                                                         |
| `startGame()`            | `START_GAME {}`                                                                                                                                              |
| `submitAnswer(value)`    | `SUBMIT_ANSWER { value }`                                                                                                                                    |
| `addBot(difficulty)`     | `ADD_BOT { difficulty }` — `difficulty` is `'EASY' \| 'MEDIUM' \| 'HARD'`. Sent by `LobbyView`'s host-only bot buttons; the backend enforces the host check. |
| `removePlayer(playerId)` | `REMOVE_PLAYER { player_id }` — sent by `LobbyView`'s host-only kick button; the target receives `KICKED`, everyone else a regular `GAME_UPDATE`.            |

### Callbacks

`GameClient` is instantiated once in `GameProvider` (via `useMemo`).
Callbacks are injected at construction:

```typescript
new GameClient(
  (game) => setGame(game), // onGameUpdate
  (err) => setError(err) // onError
);
```

The `onQuestionCountdown` callback is optional, set/unset by `GameView` via `setQuestionCountdownCallback()`.

## GameContext (src/contexts/)

| File               | Role                                                           |
| ------------------ | -------------------------------------------------------------- |
| `GameContext.ts`   | Defines `GameContextValue` (interface + `createContext`)       |
| `GameProvider.tsx` | Instantiates `GameClient`, manages `game` and `error` in state |
| `useGame.ts`       | `useGame()` hook — throws if used outside Provider             |

### GameContextValue interface

```typescript
{
  client: GameClient;
  game: Game | null;
  error: string | null;
  clearError: () => void;
  resetGame: () => void;  // resets game and error to null
}
```

`resetGame()` is called by `GamePage` on each navigation to the game route (`/game/:gameId` for a
private lobby by code, or `/game` for a quick game / resume) to start from a clean state.

## Game type (src/types.ts)

```typescript
interface Game {
  id: string;
  state: GameState;
  players: Player[];
  questions: Question[];
  current_question_index: number;
  answers: Answer[];
  start_time_current_question: number | null; // Unix timestamp (seconds)
  is_quick_game?: boolean;
  host_player_id: string | null; // set for private lobbies (the creator); null for quick games
  max_players: number; // capacity chosen by the creator (2–30) at `POST /lobbies`
}
```

## Player connection status

`Player.is_connected` (`src/types.ts`) reflects real-time connection state, including mid-game —
a socket drop during `COUNTDOWN`/`IN_PROGRESS`/`FINISHED` does **not** remove the player from
`game.players` (score preserved, reconnect via `connectToQuickGame` restores `is_connected: true`).
`LobbyView` and `GameView`'s scoreboard both grey out disconnected players instead of assuming
they vanished. The only case where a disconnected player is actually removed from the list is a
lobby still in `WAITING` state — that's done backend-side, no front handling needed.

## Friend lobby: creation and host controls

### Creating a lobby (`HomePage`, `CREATE` mode)

`HomePage` (`src/pages/HomePage.tsx`) has a third mode besides `MENU`/`JOIN`: `CREATE`, reached via
the "Créer un salon" button. That button is gated by subscription — it's `disabled` (label
"Abonnement requis") unless `isAuthenticated && subscriptionStatus?.active` (`useSubscriptionStatus`,
see `doc/subscription.md`). Joining an existing salon by code (`JOIN` mode) stays free for everyone,
authenticated or not.

`CREATE` mode shows two inputs, then calls `client.createLobby()`:

- **Niveau des questions**: a `<select>` over `LEVELS` (`src/lib/grades.ts`), labelled via
  `resolveLevelLabel`. Defaults to `'CP'`.
- **Places**: a number input for `max_players`, `min={2} max={30}`. Defaults to `DEFAULT_MAX_PLAYERS`
  (`6`).

On submit, `createLobby({ level, maxPlayers, token })` is called with the signed-in player's access
token (required — `CREATE` is unreachable without an active subscription, but the code still
guards against a missing token). Success navigates to `/game/:gameId` like any other lobby join.

### Host-only controls (`LobbyView`)

`LobbyView` derives `isHost = !game.is_quick_game && currentPlayerId === game.host_player_id`. Quick
games have no host (`host_player_id` is `null`) and never show these controls. When `isHost` is true:

- A **capacity counter** (`Places : {game.players.length}/{game.max_players}`) heads a host-only
  panel above the player list.
- Three **add-bot buttons**, one per `BOT_DIFFICULTIES` entry (`EASY`/`MEDIUM`/`HARD`, labelled
  Facile/Moyen/Difficile), each calling `client.addBot(difficulty)`. Disabled together once
  `game.players.length >= game.max_players` (`isFull`).
- A **per-player kick button** (✕) on every player card except the host's own, calling
  `client.removePlayer(player.id)`.

The backend re-checks the host permission and capacity server-side; the front only hides/disables
the affected controls for non-hosts and at capacity.

### Being kicked, or the lobby closing

There is no dedicated "you were kicked" or "the lobby closed" screen. Both `KICKED` and
`LOBBY_CLOSED` are routed through the existing `onError` flow (see the incoming-messages table
above): `GameClient` turns each into its own French error string via `onError`, which lands in
`GameContextValue.error` the same way any other `ERROR` message would. `GamePage` renders its
generic error card ("Oups !" + the message + a "Retour à l'accueil" button that calls `resetGame()`
and navigates to `/`) — the same fallback used for any other game error, not a dedicated UI.

## How to add a game flow feature

1. If the backend sends a new WS message → add its schema to `serverMessageSchema` (`src/services/gameSchemas.ts`) then the `case` in `GameClient.handleMessage()`
2. If the UI must react to it → expose a callback via `setXxxCallback()` (same pattern as `setQuestionCountdownCallback`)
3. If state must be shared between components → add it to `GameContextValue` and `GameProvider`
4. If it's a new game state → add it to `GameState` and the `switch` in `GamePage`
