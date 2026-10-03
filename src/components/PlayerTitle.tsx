import React from 'react';
import { cn } from '../lib/utils';
import { resolveRarityLabel, resolveRarityTextStyle } from '../lib/rarity';
import { resolveTitleLabel } from '../lib/labels';
import type { PlayerTitle as PlayerTitleData } from '../types';

type TitleData = Pick<PlayerTitleData, 'id' | 'rarity'>;

interface TitleLabelProps {
  title: TitleData;
  locked?: boolean;
  className?: string;
}

export const TitleLabel: React.FC<TitleLabelProps> = ({ title, locked = false, className }) => (
  <span
    title={`Titre ${resolveRarityLabel(title.rarity)}`}
    className={cn(
      'inline-block max-w-full truncate align-top text-xs font-extrabold italic',
      locked ? 'text-slate-400' : resolveRarityTextStyle(title.rarity),
      className
    )}
  >
    {locked && <span aria-hidden>🔒 </span>}
    {resolveTitleLabel(title.id)}
  </span>
);

interface PlayerTitleProps {
  title: PlayerTitleData | null;
  className?: string;
}

export const PlayerTitle: React.FC<PlayerTitleProps> = ({ title, className }) =>
  title ? <TitleLabel title={title} className={className} /> : null;
