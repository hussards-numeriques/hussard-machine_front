import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { useStreak } from '../../contexts/useStreak';
import { deriveStreakStatus } from '../../services/streak/status';
import { cn } from '../../lib/utils';
import { StreakFlame, getStreakTier } from './StreakFlame';
import { DailyQuestIcon, type QuestState } from './DailyQuestIcon';
import { useUtcMidnightCountdown } from './useUtcMidnightCountdown';

const dayLabel = (days: number): string => (days <= 1 ? `${days} jour` : `${days} jours`);

export const StreakBadge: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { streak } = useStreak();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const status = streak ? deriveStreakStatus(streak) : null;

  const questState: QuestState | null = streak
    ? streak.played_today
      ? 'secured'
      : status?.lastChance
        ? 'last-chance'
        : status?.atRisk
          ? 'soft-risk'
          : 'neutral'
    : null;

  const countdown = useUtcMidnightCountdown(open && questState === 'secured');

  if (!isAuthenticated || !streak || !status) {
    return null;
  }

  const tier = getStreakTier(status.count);

  const clickable = questState !== 'neutral';

  const popoverMessage =
    questState === 'last-chance'
      ? `Dernière chance ! Joue aujourd'hui ou tu perds ta série. ❄ Filet de sécurité de retour dans ${dayLabel(status.daysUntilFreeze ?? 0)}.`
      : questState === 'secured'
        ? `Série sécurisée pour aujourd'hui ! Prochaine quête dans ${countdown}.`
        : 'Joue aujourd’hui pour sécuriser ta série !';

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow border border-slate-200">
        {status.isAlive && (
          <span className={cn('text-sm font-black tabular-nums', tier.valueColorClass)}>
            {status.count}
          </span>
        )}
        <StreakFlame count={status.count} muted={!status.isAlive} />
        {clickable ? (
          <button
            type="button"
            aria-label="Quête quotidienne"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center"
          >
            <DailyQuestIcon state={questState} />
          </button>
        ) : (
          <DailyQuestIcon state={questState} />
        )}
      </div>

      {open && clickable && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border-2 border-slate-100 p-3 text-left text-xs font-semibold text-slate-600 leading-relaxed">
          {popoverMessage}
        </div>
      )}
    </div>
  );
};
