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

| Method          | Endpoint            | Description                                                            |
| --------------- | ------------------- | ---------------------------------------------------------------------- |
| `createLobby()` | `POST /api/lobbies` | Creates a private multiplayer lobby, returns `game_id` (the join code) |

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

| Type                 | Payload               | Action                                          |
| -------------------- | --------------------- | ----------------------------------------------- |
| `PLAYER_JOINED`      | `{ player_id, game }` | Stores `playerId`, calls `onGameUpdate(game)`   |
| `GAME_UPDATE`        | `Game`                | Calls `onGameUpdate(game)`                      |
| `COUNTDOWN`          | `{ seconds }`         | Console log (not used by UI)                    |
| `QUESTION_COUNTDOWN` | `{ seconds }`         | Calls `onQuestionCountdown(seconds)` if defined |
| `ERROR`              | `string`              | Calls `onError(message)`                        |

### Outgoing WebSocket messages

| Method                | Message sent              |
| --------------------- | ------------------------- |
| `setReady(isReady)`   | `READY { is_ready }`      |
| `startGame()`         | `START_GAME {}`           |
| `submitAnswer(value)` | `SUBMIT_ANSWER { value }` |

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
  start_time_current_question?: number; // Unix timestamp (seconds)
  is_quick_game?: boolean;
}
```

## Player connection status

`Player.is_connected` (`src/types.ts`) reflects real-time connection state, including mid-game —
a socket drop during `COUNTDOWN`/`IN_PROGRESS`/`FINISHED` does **not** remove the player from
`game.players` (score preserved, reconnect via `connectToQuickGame` restores `is_connected: true`).
`LobbyView` and `GameView`'s scoreboard both grey out disconnected players instead of assuming
they vanished. The only case where a disconnected player is actually removed from the list is a
lobby still in `WAITING` state — that's done backend-side, no front handling needed.

## How to add a game flow feature

1. If the backend sends a new WS message → add its schema to `serverMessageSchema` (`src/services/gameSchemas.ts`) then the `case` in `GameClient.handleMessage()`
2. If the UI must react to it → expose a callback via `setXxxCallback()` (same pattern as `setQuestionCountdownCallback`)
3. If state must be shared between components → add it to `GameContextValue` and `GameProvider`
4. If it's a new game state → add it to `GameState` and the `switch` in `GamePage`
