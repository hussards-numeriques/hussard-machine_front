import React from 'react';
import { GameClient } from '../services/GameClient';
import type { Game } from '../types';
import { Button } from '../components/Button';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { PlayerStreak } from '../components/PlayerStreak';
import { PlayerTitle } from '../components/PlayerTitle';
import { cn } from '../lib/utils';

interface LobbyViewProps {
  client: GameClient;
  game: Game;
  currentPlayerId: string | null;
  onLeave: () => void;
}

const BOT_DIFFICULTIES: { value: 'EASY' | 'MEDIUM' | 'HARD'; label: string }[] = [
  { value: 'EASY', label: 'Facile' },
  { value: 'MEDIUM', label: 'Moyen' },
  { value: 'HARD', label: 'Difficile' },
];

export const LobbyView: React.FC<LobbyViewProps> = ({ client, game, currentPlayerId, onLeave }) => {
  const currentPlayer = game.players.find((p) => p.id === currentPlayerId);
  const isReady = currentPlayer?.is_ready;
  const isHost = !game.is_quick_game && currentPlayerId === game.host_player_id;
  const isFull = game.players.length >= game.max_players;

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

      {isHost && (
        <div className="w-full bg-white p-6 rounded-3xl shadow-lg border-2 border-slate-100 space-y-4">
          <h3 className="text-lg font-bold text-slate-700">
            Places : {game.players.length}/{game.max_players}
          </h3>
          <div className="flex gap-2 flex-wrap">
            {BOT_DIFFICULTIES.map(({ value, label }) => (
              <Button
                key={value}
                variant="secondary"
                size="sm"
                disabled={isFull}
                onClick={() => client.addBot(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}

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
                !player.is_connected
                  ? 'border-slate-100 bg-slate-50 opacity-50'
                  : player.is_ready
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-100 bg-slate-50'
              )}
            >
              <PlayerAvatar name={player.name} grade={player.grade} isBot={player.is_bot} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 truncate">{player.name}</span>
                  <PlayerStreak count={player.daily_streak} />
                </div>
                <PlayerTitle title={player.title} />
                {(!player.is_connected || player.is_bot) && (
                  <div className="text-xs text-slate-500">
                    {!player.is_connected ? 'Déconnecté' : 'Robot'}
                  </div>
                )}
              </div>
              {player.is_connected && player.is_ready && (
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
              {isHost && player.id !== currentPlayerId && (
                <button
                  type="button"
                  aria-label={`Exclure ${player.name}`}
                  onClick={() => client.removePlayer(player.id)}
                  className="text-rose-400 hover:text-rose-600 text-xl font-bold px-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-8 left-0 right-0 px-4 flex justify-center gap-4">
        {!isReady && (
          <Button size="lg" variant="secondary" onClick={onLeave} className="shadow-xl">
            Quitter
          </Button>
        )}

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
