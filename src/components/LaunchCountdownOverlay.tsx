import React from 'react';
import type { Player } from '../types';
import { Mascot } from './Mascot';
import { PlayerAvatar } from './PlayerAvatar';
import { cn } from '../lib/utils';

interface LaunchCountdownOverlayProps {
  seconds: number | null;
  players: Player[];
}

const countdownLabel = (seconds: number | null): string => {
  if (seconds === null) return 'Prêts ?';
  if (seconds === 0) return 'GO !';
  return String(seconds);
};

export const LaunchCountdownOverlay: React.FC<LaunchCountdownOverlayProps> = ({
  seconds,
  players,
}) => {
  const label = countdownLabel(seconds);
  const isGo = seconds === 0;

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 px-4 pb-32 bg-primary-dark/90 backdrop-blur-sm">
      <Mascot
        pose={isGo ? 'champion' : 'determine'}
        size={112}
        className="motion-safe:animate-bounce"
      />

      <div className="relative flex items-center justify-center w-44 h-44">
        <span
          key={`ring-${label}`}
          aria-hidden="true"
          className="absolute inset-0 rounded-full border-4 border-secondary opacity-60 motion-safe:animate-ping"
        />
        <span className="absolute inset-3 rounded-full bg-primary shadow-2xl shadow-secondary/40" />
        <span
          key={label}
          role="status"
          aria-live="assertive"
          className={cn(
            'relative font-black motion-safe:animate-countdown-pop',
            isGo ? 'text-5xl text-secondary' : 'text-8xl text-white'
          )}
        >
          {label}
        </span>
      </div>

      <p className="text-xl font-black text-primary-light">La partie commence !</p>

      <div className="flex flex-wrap justify-center gap-3">
        {players.map((player) => (
          <div key={player.id} className="rounded-full shadow-lg shadow-secondary/60">
            <PlayerAvatar name={player.name} grade={player.grade} isBot={player.is_bot} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
};
