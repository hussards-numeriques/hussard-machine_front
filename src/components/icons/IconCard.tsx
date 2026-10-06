import React from 'react';
import { cn } from '../../lib/utils';
import { resolveRarityBadgeStyle, resolveRarityLabel } from '../../lib/rarity';
import { resolveIconLabel } from '../../lib/labels';
import type { PlayerIcon } from '../../services/icons';
import { useTranslation } from 'react-i18next';

interface IconCardProps {
  icon: PlayerIcon;
  unlocked: boolean;
  selected: boolean;
  onEquip: (iconId: string | null) => void;
  isPending: boolean;
}

export const IconCard: React.FC<IconCardProps> = ({
  icon,
  unlocked,
  selected,
  onEquip,
  isPending,
}) => {
  const { t } = useTranslation();
  const label = resolveIconLabel(icon.id, t);
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-2xl border-2',
        unlocked ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-100'
      )}
    >
      <img
        src={icon.url}
        alt={label}
        className={cn('w-16 h-16 rounded-full object-cover', !unlocked && 'opacity-40 grayscale')}
      />
      <span
        className={cn(
          'text-sm font-bold text-center',
          unlocked ? 'text-slate-700' : 'text-slate-400'
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'text-xs font-bold px-2 py-0.5 rounded-full border',
          resolveRarityBadgeStyle(icon.rarity)
        )}
      >
        {resolveRarityLabel(icon.rarity, t)}
      </span>
      {unlocked && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => onEquip(selected ? null : icon.id)}
          className={cn(
            'text-xs font-bold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50',
            selected
              ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
              : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
          )}
        >
          {selected ? t('common.equipped') : t('common.equip')}
        </button>
      )}
    </div>
  );
};
