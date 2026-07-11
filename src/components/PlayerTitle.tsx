import React from 'react';
import { cn } from '../lib/utils';
import { resolveRarityTextColor } from '../lib/titles';
import type { PlayerTitle as PlayerTitleData } from '../types';

interface PlayerTitleProps {
  title: PlayerTitleData | null;
  className?: string;
}

export const PlayerTitle: React.FC<PlayerTitleProps> = ({ title, className }) => {
  if (!title) return null;

  return (
    <div
      className={cn('text-xs font-bold truncate', resolveRarityTextColor(title.rarity), className)}
    >
      ☆ {title.label}
    </div>
  );
};
