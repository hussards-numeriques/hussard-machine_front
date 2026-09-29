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
  const isNumber = seconds !== null && seconds > 0;

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 px-4 bg-slate-50">
      <Mascot pose={seconds === 0 ? 'champion' : 'determine'} size={96} />

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
          La partie commence
        </p>
        <span
          key={label}
          role="status"
          aria-live="assertive"
          className={cn(
            'font-black text-primary tabular-nums leading-none motion-safe:animate-countdown-pop',
            isNumber ? 'text-9xl' : 'text-6xl'
          )}
        >
          {label}
        </span>
      </div>

      <ul className="flex flex-wrap justify-center gap-4 max-w-md">
        {players.map((player) => (
          <li key={player.id} className="flex flex-col items-center gap-1 w-16">
            <PlayerAvatar name={player.name} grade={player.grade} isBot={player.is_bot} size="sm" />
            <span className="text-xs font-bold text-slate-600 truncate w-full text-center">
              {player.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
