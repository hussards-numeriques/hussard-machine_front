# Game Flow — Cycle de vie d'une partie

## États du jeu

```typescript
// src/types.ts
const GameState = {
  WAITING: 'WAITING', // salon ouvert, joueurs rejoignent
  COUNTDOWN: 'COUNTDOWN', // décompte avant démarrage (affiché dans LobbyView)
  IN_PROGRESS: 'IN_PROGRESS', // partie en cours
  FINISHED: 'FINISHED', // partie terminée, podium affiché
};
```

La page `GamePage` lit `game.state` et rend la vue correspondante. Voir [routing.md](routing.md) pour le détail.

## GameClient (src/services/GameClient.ts)

Classe qui encapsule la connexion WebSocket et les appels REST de création de parties.

### Appels REST

| Méthode             | Endpoint                | Description                                       |
| ------------------- | ----------------------- | ------------------------------------------------- |
| `createLobby()`     | `POST /api/lobbies`     | Crée un salon multijoueur, retourne `game_id`     |
| `createQuickGame()` | `POST /api/quick-games` | Crée une partie rapide (bots), retourne `game_id` |

### Connexion WebSocket

```typescript
client.connect(gameId, playerName, token?)
// → ouvre ws://{host}/ws/game/{gameId}
// → envoie immédiatement JOIN { name, token }
```

Le token JWT optionnel lie la session de jeu au compte authentifié (pour l'XP).

### Messages WebSocket entrants

| Type                 | Payload               | Action                                           |
| -------------------- | --------------------- | ------------------------------------------------ |
| `PLAYER_JOINED`      | `{ player_id, game }` | Stocke `playerId`, appelle `onGameUpdate(game)`  |
| `GAME_UPDATE`        | `Game`                | Appelle `onGameUpdate(game)`                     |
| `COUNTDOWN`          | `{ seconds }`         | Log console (non utilisé par l'UI)               |
| `QUESTION_COUNTDOWN` | `{ seconds }`         | Appelle `onQuestionCountdown(seconds)` si défini |
| `ERROR`              | `string`              | Appelle `onError(message)`                       |

### Messages WebSocket sortants

| Méthode               | Message envoyé            |
| --------------------- | ------------------------- |
| `setReady(isReady)`   | `READY { is_ready }`      |
| `startGame()`         | `START_GAME {}`           |
| `submitAnswer(value)` | `SUBMIT_ANSWER { value }` |

### Callbacks

Le `GameClient` est instancié une seule fois dans `GameProvider` (via `useMemo`).
Les callbacks sont injectés à la construction :

```typescript
new GameClient(
  (game) => setGame(game), // onGameUpdate
  (err) => setError(err) // onError
);
```

Le callback `onQuestionCountdown` est optionnel, défini/détruit par `GameView` via `setQuestionCountdownCallback()`.

## GameContext (src/contexts/)

| Fichier            | Rôle                                                         |
| ------------------ | ------------------------------------------------------------ |
| `GameContext.ts`   | Définit `GameContextValue` (interface + `createContext`)     |
| `GameProvider.tsx` | Instancie `GameClient`, gère `game` et `error` en state      |
| `useGame.ts`       | Hook `useGame()` — lance une erreur si utilisé hors Provider |

### Interface GameContextValue

```typescript
{
  client: GameClient;
  game: Game | null;
  error: string | null;
  clearError: () => void;
  resetGame: () => void;  // remet game et error à null
}
```

`resetGame()` est appelé par `GamePage` à chaque navigation vers `/game/:id` pour repartir d'un état propre.

## Type Game (src/types.ts)

```typescript
interface Game {
  id: string;
  state: GameState;
  players: Player[];
  questions: Question[];
  current_question_index: number;
  answers: Answer[];
  start_time_current_question?: number; // timestamp Unix (secondes)
  is_quick_game?: boolean;
}
```

## Comment ajouter une feature liée au flux de jeu

1. Si le backend envoie un nouveau message WS → ajouter le `case` dans `GameClient.handleMessage()`
2. Si l'UI doit réagir à ce message → exposer une callback via `setXxxCallback()` (même pattern que `setQuestionCountdownCallback`)
3. Si l'état doit être partagé entre composants → l'ajouter dans `GameContextValue` et `GameProvider`
4. Si c'est un nouvel état de jeu → ajouter dans `GameState` et le `switch` de `GamePage`
