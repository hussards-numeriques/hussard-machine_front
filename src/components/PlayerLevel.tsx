import React from 'react';
import { cn } from '../lib/utils';
import { resolveLevelLabel } from '../lib/grades';
import { useTranslation } from 'react-i18next';

interface PlayerLevelProps {
  level: string;
  className?: string;
}

export const PlayerLevel: React.FC<PlayerLevelProps> = ({ level, className }) => {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full',
        className
      )}
    >
      {resolveLevelLabel(level, t, 'short')}
    </span>
  );
};
