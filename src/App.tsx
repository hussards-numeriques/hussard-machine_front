import { useState } from 'react';
import { GameClient } from './services/GameClient';
import type { Game } from './types';
import { GameState } from './types';
import { HomeView } from './views/HomeView';
import { LobbyView } from './views/LobbyView';
import { GameView } from './views/GameView';
import { PodiumView } from './views/PodiumView';

function App() {
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [client] = useState<GameClient>(
    () =>
      new GameClient(
        (newGame) => setGame(newGame),
        (err) => setError(err)
      )
  );

  const handleJoin = (gameId: string, playerName: string) => {
    client.connect(gameId, playerName);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-xl border-2 border-rose-200">
          <h1 className="text-2xl font-bold text-rose-600 mb-4">Oups !</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Recharger
          </button>
        </div>
      </div>
    );
  }

  if (!game) {
    return <HomeView client={client} onJoin={handleJoin} />;
  }

  switch (game.state) {
    case GameState.WAITING:
    case GameState.COUNTDOWN:
      return <LobbyView client={client} game={game} currentPlayerId={client.getPlayerId()} />;
    case GameState.IN_PROGRESS:
      return <GameView client={client} game={game} currentPlayerId={client.getPlayerId()} />;
    case GameState.FINISHED:
      return <PodiumView game={game} currentPlayerId={client.getPlayerId()} />;
    default:
      return <div>État inconnu: {game.state}</div>;
  }
}

export default App;
