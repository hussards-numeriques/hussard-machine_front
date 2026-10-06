import React, { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/useAuth';
import { useStreak } from '../../contexts/useStreak';
import { useClickOutside } from '../../hooks/useClickOutside';
import { deriveStreakStatus, type StreakStatus } from '../../services/streak/status';
import type { StreakResponse } from '../../services/streak';
import { cn } from '../../lib/utils';
import { StreakFlame, getNextStreakTier, getStreakTier } from './StreakFlame';
import { DailyQuestIcon, type QuestState } from './DailyQuestIcon';
import { useUtcMidnightCountdown } from './useUtcMidnightCountdown';

const CHIP_STYLES: Record<QuestState, string> = {
  secured: 'hover:bg-slate-100',
  'soft-risk': 'bg-amber-50 hover:bg-amber-100',
  'last-chance': 'bg-rose-50 ring-2 ring-rose-300 hover:bg-rose-100',
  neutral: 'hover:bg-slate-100',
};

const POPOVER_ACCENTS: Record<QuestState, string> = {
  secured: 'bg-emerald-50 text-emerald-700',
  'soft-risk': 'bg-amber-50 text-amber-800',
  'last-chance': 'bg-rose-50 text-rose-700',
  neutral: 'bg-slate-50 text-slate-600',
};

const toQuestState = (streak: StreakResponse, status: StreakStatus): QuestState => {
  if (streak.played_today) {
    return 'secured';
  }
  if (status.lastChance) {
    return 'last-chance';
  }
  return status.atRisk ? 'soft-risk' : 'neutral';
};

const NextTierHint: React.FC<{ count: number }> = ({ count }) => {
  const { t } = useTranslation();
  const next = getNextStreakTier(count);
  if (!next) {
    return <p className="text-xs font-bold text-amber-600">{t('streak.ultimate')}</p>;
  }
  return (
    <p className="text-xs font-bold text-slate-500">
      {t('streak.nextTier', { count: next.min - count })}{' '}
      <span className="inline-block align-middle">
        <next.Flame size={16} animated={false} />
      </span>
    </p>
  );
};

export const StreakBadge: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { streak } = useStreak();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(containerRef, open, close);

  const status = streak ? deriveStreakStatus(streak) : null;
  const questState: QuestState = streak && status ? toQuestState(streak, status) : 'neutral';
  const countdown = useUtcMidnightCountdown(open && questState === 'secured');

  if (!isAuthenticated || !streak || !status) {
    return null;
  }

  const tier = getStreakTier(status.count);

  const popoverMessage: Record<QuestState, string> = {
    'last-chance': t('streak.lastChance', { count: status.daysUntilFreeze ?? 0 }),
    secured: t('streak.secured', { countdown }),
    'soft-risk': t('streak.softRisk'),
    neutral: t('streak.neutral'),
  };

  return (
    <div ref={containerRef}>
      <button
        type="button"
        aria-label={t('streak.dailyQuest')}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1 h-9 px-2 rounded-full transition-colors',
          CHIP_STYLES[questState]
        )}
      >
        <span className="relative flex">
          <StreakFlame count={status.count} muted={!status.isAlive} size={24} />
          <span className="absolute -right-1 -bottom-0.5 flex rounded-full bg-white">
            <DailyQuestIcon state={questState} size={12} />
          </span>
        </span>
        {status.isAlive && (
          <span
            className={cn('text-base font-black tabular-nums leading-none', tier.valueColorClass)}
          >
            {status.count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 z-20 bg-white rounded-2xl shadow-xl border-2 border-slate-100 p-3 text-left space-y-3 animate-pop-in origin-top-right">
          <div className="flex items-center gap-3">
            <StreakFlame count={status.count} muted={!status.isAlive} size={40} />
            <div>
              <p
                className={cn(
                  'text-2xl font-black leading-none',
                  status.isAlive ? tier.valueColorClass : 'text-slate-400'
                )}
              >
                {status.isAlive ? t('streak.days', { count: status.count }) : t('streak.none')}
              </p>
              <NextTierHint count={status.count} />
            </div>
          </div>
          <p
            className={cn(
              'flex gap-2 items-start rounded-xl p-2 text-xs font-semibold leading-relaxed',
              POPOVER_ACCENTS[questState]
            )}
          >
            <span className="shrink-0 mt-px">
              <DailyQuestIcon state={questState} size={14} animated={false} />
            </span>
            {popoverMessage[questState]}
          </p>
          <Link
            to="/progression"
            onClick={close}
            className="block text-xs font-bold text-primary hover:underline"
          >
            {t('streak.howItWorks')}
          </Link>
        </div>
      )}
    </div>
  );
};
