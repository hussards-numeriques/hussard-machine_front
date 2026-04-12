import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../contexts/useGame';
import { GameState } from '../types';
import { LobbyView } from '../views/LobbyView';
import { GameView } from '../views/GameView';
import { PodiumView } from '../views/PodiumView';

export const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { client, game, error, resetGame } = useGame();

  const locationState = (location.state ?? null) as {
    playerName?: string;
    token?: string | null;
  } | null;
  const playerName = locationState?.playerName ?? '';
  const token = locationState?.token ?? null;

  useEffect(() => {
    if (!gameId || !playerName) {
      navigate('/', { replace: true });
      return;
    }
    resetGame();
    client.connect(gameId, playerName, token);
  }, [client, gameId, playerName, token, navigate, resetGame]);

  const handleBackHome = () => {
    resetGame();
    navigate('/', { replace: true });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-xl border-2 border-rose-200">
          <h1 className="text-2xl font-bold text-rose-600 mb-4">Oups !</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={handleBackHome}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 font-bold">Connexion au salon...</p>
      </div>
    );
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
};
