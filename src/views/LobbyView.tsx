import React from 'react';
import { GameClient } from '../services/GameClient';
import type { Game } from '../types';
import { Button } from '../components/Button';
import { cn } from '../lib/utils';

interface LobbyViewProps {
  client: GameClient;
  game: Game;
  currentPlayerId: string | null;
}

export const LobbyView: React.FC<LobbyViewProps> = ({ client, game, currentPlayerId }) => {
  const currentPlayer = game.players.find((p) => p.id === currentPlayerId);
  const isReady = currentPlayer?.is_ready;

  const handleReady = () => {
    client.setReady(!isReady);
  };

  const handleStart = () => {
    client.startGame();
  };

  const canStart = game.players.length >= 1 && game.players.every((p) => p.is_ready);

  return (
    <div className="flex flex-col items-center min-h-screen p-4 space-y-8 max-w-2xl mx-auto w-full">
      <div className="text-center space-y-2 mt-8">
        {game.is_quick_game ? (
          <h2 className="text-2xl font-bold text-slate-500">Partie Rapide</h2>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-slate-500">Code du Salon</h2>
            <div className="text-6xl font-black text-primary tracking-widest font-mono bg-white px-8 py-4 rounded-2xl shadow-sm border-2 border-slate-200">
              {game.id}
            </div>
          </>
        )}
      </div>

      <div className="w-full bg-white p-6 rounded-3xl shadow-lg border-2 border-slate-100">
        <h3 className="text-xl font-bold text-slate-700 mb-6 flex justify-between items-center">
          <span>Joueurs ({game.players.length})</span>
          {game.state === 'COUNTDOWN' && (
            <span className="text-rose-500 animate-pulse">Démarrage...</span>
          )}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {game.players.map((player) => (
            <div
              key={player.id}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border-2 transition-all',
                player.is_ready
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-slate-100 bg-slate-50'
              )}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white',
                  player.is_bot ? 'bg-slate-400' : 'bg-primary'
                )}
              >
                {player.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-800">{player.name}</div>
                <div className="text-xs text-slate-500">{player.is_bot ? 'Robot' : 'Humain'}</div>
              </div>
              {player.is_ready && (
                <div className="text-emerald-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-8 left-0 right-0 px-4 flex justify-center gap-4">
        <Button
          size="lg"
          variant={isReady ? 'secondary' : 'primary'}
          onClick={handleReady}
          className="w-full max-w-xs shadow-xl"
        >
          {isReady ? 'Je ne suis plus prêt' : 'Je suis prêt !'}
        </Button>

        {/* Only show start if at least 1 player (dev mode) or 2 (prod) and all ready */}
        {/* Hide start button for quick games as they start automatically */}
        {canStart && !game.is_quick_game && (
          <Button
            size="lg"
            variant="success"
            onClick={handleStart}
            className="w-full max-w-xs shadow-xl animate-bounce-short"
          >
            Lancer la partie !
          </Button>
        )}
      </div>
    </div>
  );
};
