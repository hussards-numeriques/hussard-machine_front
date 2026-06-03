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

| Method              | Endpoint                | Description                                    |
| ------------------- | ----------------------- | ---------------------------------------------- |
| `createLobby()`     | `POST /api/lobbies`     | Creates a multiplayer lobby, returns `game_id` |
| `createQuickGame()` | `POST /api/quick-games` | Creates a quick game (bots), returns `game_id` |

### WebSocket connection

```typescript
client.connect(gameId, playerName, token?)
// → opens ws://{host}/ws/game/{gameId}
// → immediately sends JOIN { name, token }
```

The optional JWT token links the game session to an authenticated account (for XP).

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

`resetGame()` is called by `GamePage` on each navigation to `/game/:id` to start from a clean state.

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

## How to add a game flow feature

1. If the backend sends a new WS message → add the `case` in `GameClient.handleMessage()`
2. If the UI must react to it → expose a callback via `setXxxCallback()` (same pattern as `setQuestionCountdownCallback`)
3. If state must be shared between components → add it to `GameContextValue` and `GameProvider`
4. If it's a new game state → add it to `GameState` and the `switch` in `GamePage`
