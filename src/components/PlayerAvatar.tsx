import type { TFunction } from 'i18next';
import React from 'react';
import { cn } from '../lib/utils';
import { resolveGradeLabel, resolveGradeMetal, resolveLevelLabel } from '../lib/grades';
import { useTranslation } from 'react-i18next';

type AvatarSize = 'sm' | 'md' | 'lg';

interface PlayerAvatarProps {
  name: string;
  grade: string;
  isBot: boolean;
  level?: string;
  iconUrl?: string | null;
  size?: AvatarSize;
}

const SIZE_CLASSES: Record<AvatarSize, { face: string; text: string; ring: string; tab: string }> =
  {
    sm: { face: 'w-9 h-9', text: 'text-sm', ring: 'p-[3px]', tab: 'text-[9px] px-1' },
    md: { face: 'w-12 h-12', text: 'text-xl', ring: 'p-1', tab: 'text-[10px] px-1.5' },
    lg: { face: 'w-16 h-16', text: 'text-2xl', ring: 'p-[5px]', tab: 'text-xs px-2' },
  };

const rankDescription = (grade: string, level: string | undefined, t: TFunction): string =>
  level
    ? `${resolveLevelLabel(level, t, 'long')} · ${resolveGradeLabel(grade, t)}`
    : resolveGradeLabel(grade, t);

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  name,
  grade,
  isBot,
  level,
  iconUrl,
  size = 'md',
}) => {
  const { t } = useTranslation();
  const { face, text, ring, tab } = SIZE_CLASSES[size];
  const metal = resolveGradeMetal(grade);

  return (
    <div
      data-testid="player-avatar"
      title={rankDescription(grade, level, t)}
      className={cn('relative shrink-0 rounded-full grade-ring', ring, metal, level && 'mb-2')}
    >
      {iconUrl ? (
        <img src={iconUrl} alt={name} className={cn('rounded-full object-cover bg-white', face)} />
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-black text-white',
            face,
            text,
            isBot ? 'bg-slate-400' : 'bg-primary'
          )}
        >
          {name.substring(0, 2).toUpperCase()}
        </div>
      )}
      {level && (
        <span
          className={cn(
            'grade-tab absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 rounded-full border py-px font-black leading-none whitespace-nowrap',
            metal,
            tab
          )}
        >
          {resolveLevelLabel(level, t, 'short')}
        </span>
      )}
    </div>
  );
};
