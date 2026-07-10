import React from 'react';
import { cn } from '../lib/utils';
import { StreakFlame, getStreakTier } from './streak/StreakFlame';

interface PlayerStreakProps {
  count: number;
  size?: number;
}

export const PlayerStreak: React.FC<PlayerStreakProps> = ({ count, size = 20 }) => {
  if (count <= 0) return null;

  const { valueColorClass } = getStreakTier(count);

  return (
    <span className="inline-flex items-center gap-0.5">
      <StreakFlame count={count} size={size} animated={false} />
      <span className={cn('text-xs font-bold tabular-nums', valueColorClass)}>{count}</span>
    </span>
  );
};
