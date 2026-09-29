import React from 'react';
import { cn } from '../lib/utils';
import { resolveRarityIcon, resolveRarityLabel, resolveRarityPlate } from '../lib/rarity';
import type { PlayerTitle as PlayerTitleData } from '../types';

type TitleData = Pick<PlayerTitleData, 'label' | 'rarity'>;

interface TitlePlateProps {
  title: TitleData;
  locked?: boolean;
  className?: string;
}

export const TitlePlate: React.FC<TitlePlateProps> = ({ title, locked = false, className }) => (
  <span
    title={`Titre ${resolveRarityLabel(title.rarity)}`}
    className={cn(
      'title-plate',
      resolveRarityPlate(title.rarity),
      locked && 'title-plate-locked',
      className
    )}
  >
    <span aria-hidden className="shrink-0">
      {locked ? '🔒' : resolveRarityIcon(title.rarity)}
    </span>
    <span className="truncate">{title.label}</span>
  </span>
);

interface PlayerTitleProps {
  title: PlayerTitleData | null;
  className?: string;
}

export const PlayerTitle: React.FC<PlayerTitleProps> = ({ title, className }) =>
  title ? (
    <div className="flex min-w-0 mt-0.5">
      <TitlePlate title={title} className={className} />
    </div>
  ) : null;
