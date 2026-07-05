import React from 'react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import type { Game } from '../types';
import { Button } from '../components/Button';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/useAuth';

interface PodiumViewProps {
  game: Game;
  currentPlayerId: string | null;
  playerName: string;
}

export const PodiumView: React.FC<PodiumViewProps> = ({ game, currentPlayerId, playerName }) => {
  const navigate = useNavigate();
  const { isAuthenticated, client: authClient } = useAuth();
  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  const handleReplay = () => {
    const token = isAuthenticated ? authClient.getAccessToken() : null;
    navigate('/game', { state: { playerName, token } });
  };

  React.useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8 bg-slate-50 text-slate-900">
      <h1 className="text-4xl font-black text-center text-primary">Résultats Finaux</h1>

      <div className="flex items-end justify-center gap-4 h-64 w-full max-w-md pb-8">
        {/* 2nd Place */}
        {sortedPlayers[1] && (
          <div className="flex flex-col items-center gap-2 w-1/3">
            <div className="font-bold text-slate-600 w-full text-center truncate">
              {sortedPlayers[1].name}
            </div>
            <div className="w-full bg-slate-200 h-32 rounded-t-xl flex items-end justify-center pb-2 font-bold text-2xl text-slate-600 border-t-4 border-slate-300">
              2
            </div>
            <div className="font-mono text-slate-500">{sortedPlayers[1].score} pts</div>
          </div>
        )}

        {/* 1st Place */}
        {winner && (
          <div className="flex flex-col items-center gap-2 w-1/3">
            <div className="font-bold text-amber-500 text-xl w-full text-center truncate">
              👑 {winner.name}
            </div>
            <div className="w-full bg-secondary h-48 rounded-t-xl flex items-end justify-center pb-2 font-bold text-4xl text-yellow-900 border-t-4 border-yellow-300 shadow-[0_0_30px_rgba(251,191,36,0.4)]">
              1
            </div>
            <div className="font-mono text-amber-600 font-bold">{winner.score} pts</div>
          </div>
        )}

        {/* 3rd Place */}
        {sortedPlayers[2] && (
          <div className="flex flex-col items-center gap-2 w-1/3">
            <div className="font-bold text-slate-600 w-full text-center truncate">
              {sortedPlayers[2].name}
            </div>
            <div className="w-full bg-orange-300 h-24 rounded-t-xl flex items-end justify-center pb-2 font-bold text-2xl text-orange-900 border-t-4 border-orange-400">
              3
            </div>
            <div className="font-mono text-slate-500">{sortedPlayers[2].score} pts</div>
          </div>
        )}
      </div>

      <div className="w-full max-w-md bg-white p-6 rounded-3xl shadow-lg border-2 border-slate-100">
        <h3 className="text-xl font-bold text-slate-700 mb-4">Classement complet</h3>
        {sortedPlayers.map((p, i) => (
          <div
            key={p.id}
            className={cn(
              'flex justify-between py-3 px-4 rounded-lg mb-2',
              p.id === currentPlayerId ? 'bg-primary/10 text-primary font-bold' : 'bg-slate-50'
            )}
          >
            <div className="flex gap-4">
              <span className="font-mono w-6">{i + 1}.</span>
              <span className="font-bold">{p.name}</span>
            </div>
            <span className="font-mono">{p.score} pts</span>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Button variant="secondary" onClick={() => navigate('/')}>
          Retour à l'accueil
        </Button>
        <Button onClick={handleReplay}>Rejouer</Button>
      </div>
    </div>
  );
};
