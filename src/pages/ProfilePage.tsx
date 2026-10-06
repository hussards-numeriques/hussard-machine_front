import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import type { GameHistoryEntry } from '../types';
import { ApiError } from '../services/http';
import { useGameConfig } from '../hooks/useGameConfig';
import {
  usePlayerProfile,
  usePromotePlayer,
  useDemotePlayer,
  useDeleteAccount,
} from '../hooks/usePlayerProfile';
import { useSubscriptionStatus } from '../hooks/useSubscription';
import { formatLongDate } from '../lib/date';
import { AnswerDots } from '../components/AnswerDots';
import { getAggregatedAnswerResults } from '../lib/answerDots';
import {
  LevelChangeConfirmModal,
  type LevelChangeVariant,
} from '../components/LevelChangeConfirmModal';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { resolveGradeLabel, resolveGradeStyle, resolveLevelLabel } from '../lib/grades';
import { SegmentedXpBar } from '../components/grade/SegmentedXpBar';
import { DeleteAccountModal } from '../components/DeleteAccountModal';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import i18n from '../i18n';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(i18n.language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}min ${s}s` : `${s}s`;
}

const GradeBadge: React.FC<{ grade: string }> = ({ grade }) => {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${resolveGradeStyle(grade)}`}
    >
      {resolveGradeLabel(grade, t)}
    </span>
  );
};

const HistoryRow: React.FC<{
  entry: GameHistoryEntry;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ entry, isExpanded, onToggle }) => {
  const { t } = useTranslation();
  const medal = RANK_MEDALS[entry.my_rank - 1] ?? `#${entry.my_rank}`;
  const sortedParticipants = [...entry.participants].sort((a, b) => a.final_rank - b.final_rank);

  return (
    <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 hover:bg-white transition-colors text-left"
      >
        <div className="text-2xl w-8 text-center">{medal}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-700">{formatDate(entry.played_at)}</span>
            {entry.is_quick_game && (
              <span className="text-xs bg-secondary/20 text-yellow-800 font-bold px-2 py-0.5 rounded-full">
                {t('profile.ranked')}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {t('profile.historySummary', {
              correct: entry.my_correct_answers,
              total: entry.my_total_answers,
              score: entry.my_score,
              duration: formatDuration(entry.duration_seconds),
            })}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div
            className={`text-sm font-black ${entry.experience_gained >= 0 ? 'text-primary' : 'text-red-500'}`}
          >
            {entry.experience_gained >= 0 ? '+' : ''}
            {entry.experience_gained} XP
          </div>
          {entry.winner_display_name && (
            <div className="text-xs text-slate-400 truncate max-w-24">
              🏆 {entry.winner_display_name}
            </div>
          )}
        </div>
        <div className="text-slate-400 text-xs shrink-0">{isExpanded ? '▲' : '▼'}</div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-100 px-4 pb-4">
          <table className="w-full text-xs mt-3">
            <thead>
              <tr className="text-slate-400 font-bold border-b border-slate-100">
                <th className="text-left py-1">{t('profile.columns.rank')}</th>
                <th className="text-left py-1">{t('profile.columns.player')}</th>
                <th className="text-right py-1">{t('profile.columns.answers')}</th>
                <th className="text-right py-1">{t('profile.columns.points')}</th>
                <th className="text-right py-1">XP</th>
              </tr>
            </thead>
            <tbody>
              {sortedParticipants.map((p) => (
                <tr
                  key={`${p.display_name}-${p.final_rank}`}
                  className="border-b border-slate-50 last:border-0"
                >
                  <td className="py-1.5 font-bold text-slate-600">
                    {RANK_MEDALS[p.final_rank - 1] ?? `#${p.final_rank}`}
                  </td>
                  <td className="py-1.5">
                    <span
                      className={`font-bold ${p.is_bot ? 'text-violet-500' : 'text-slate-700'}`}
                    >
                      {p.display_name}
                      {p.is_bot && (
                        <span className="ml-1 text-xs font-normal text-violet-400">
                          {t('profile.bot')}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-1.5">
                    <div className="flex justify-end">
                      <AnswerDots
                        results={getAggregatedAnswerResults(
                          p.correct_answers,
                          p.total_answers,
                          entry.questions_count
                        )}
                        maxWidthCh={10}
                      />
                    </div>
                  </td>
                  <td className="py-1.5 text-right font-bold text-slate-700">{p.score}</td>
                  <td
                    className={`py-1.5 text-right font-black ${p.experience_gained >= 0 ? 'text-primary' : 'text-red-500'}`}
                  >
                    {p.experience_gained >= 0 ? '+' : ''}
                    {p.experience_gained}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ProfileNotice: React.FC<{ message: string }> = ({ message }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
        <h1 className="text-3xl font-black text-primary-dark">{t('profile.title')}</h1>
        <p className="text-slate-600">{message}</p>
        <Link to="/" className="inline-block text-primary font-bold hover:underline">
          {t('common.backHome')}
        </Link>
      </div>
    </div>
  );
};

const DangerZone: React.FC<{ onDeleteRequest: () => void }> = ({ onDeleteRequest }) => {
  const { t } = useTranslation();
  return (
    <section className="rounded-3xl border-2 border-rose-200 bg-rose-50 p-6 space-y-3">
      <h2 className="text-xl font-black text-rose-600">{t('profile.dangerTitle')}</h2>
      <p className="text-sm text-slate-600">{t('profile.dangerText')}</p>
      <button
        type="button"
        onClick={onDeleteRequest}
        className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-base transition-colors shadow"
      >
        {t('profile.deleteAccount')}
      </button>
    </section>
  );
};

const deletionErrorMessage = (error: unknown, t: TFunction): string =>
  error instanceof ApiError ? t('profile.deletionFailed') : t('profile.networkError');

const profileErrorMessage = (error: unknown, t: TFunction): string => {
  if (error instanceof ApiError && error.status === 404) {
    return t('profile.notFound');
  }
  if (error instanceof ApiError) {
    return t('profile.loadFailed');
  }
  return t('profile.networkErrorRetry');
};

export const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: config } = useGameConfig();
  const profileQuery = usePlayerProfile();
  const subscriptionQuery = useSubscriptionStatus();
  const promotion = usePromotePlayer();
  const demotion = useDemotePlayer();
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [pendingLevelChange, setPendingLevelChange] = useState<LevelChangeVariant | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const accountDeletion = useDeleteAccount();
  const navigate = useNavigate();

  const profile = profileQuery.data;
  const promoting = promotion.isPending;
  const promoteError = promotion.isError
    ? promotion.error instanceof ApiError
      ? t('profile.promotionFailed')
      : t('profile.networkError')
    : null;
  const demoting = demotion.isPending;
  const demoteError = demotion.isError
    ? demotion.error instanceof ApiError
      ? t('profile.demotionFailed')
      : t('profile.networkError')
    : null;

  const handlePromote = () => {
    promotion.mutate();
  };

  const handleDemote = () => {
    demotion.mutate();
  };

  const handleDeleteAccount = () => {
    accountDeletion.mutate(undefined, {
      onSuccess: () => navigate('/', { replace: true }),
    });
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    accountDeletion.reset();
  };

  const toggleEntry = (id: string) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (authLoading || profileQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-lg font-bold animate-pulse">{t('common.loading')}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <ProfileNotice message={t('profile.loginRequired')} />;
  }

  if (!profile) {
    return (
      <ProfileNotice
        message={
          profileQuery.isError
            ? profileErrorMessage(profileQuery.error, t)
            : t('profile.unavailable')
        }
      />
    );
  }

  const gradeBg = resolveGradeStyle(profile.grade).split(' ')[0];
  const nextLevelKey = config ? config.levels[config.levels.indexOf(profile.level) + 1] : undefined;
  const previousLevelKey = config
    ? config.levels[config.levels.indexOf(profile.level) - 1]
    : undefined;
  const nextLevelLabel =
    nextLevelKey != null ? resolveLevelLabel(nextLevelKey, t, 'long') : t('profile.nextLevel');
  const previousLevelLabel =
    previousLevelKey != null
      ? resolveLevelLabel(previousLevelKey, t, 'long')
      : t('profile.previousLevel');
  const canDemote = previousLevelKey != null;

  return (
    <div className="min-h-screen p-4 pt-20 max-w-2xl mx-auto space-y-6">
      <div className={`${gradeBg} rounded-3xl p-8 space-y-5 border-2 border-white shadow-lg`}>
        <div className="flex items-center gap-4">
          <PlayerAvatar
            name={profile.username}
            grade={profile.grade}
            level={profile.level}
            iconUrl={profile.selected_icon_url}
            isBot={false}
            size="lg"
          />
          <div>
            <h1 className="text-2xl font-black text-slate-800">{profile.username}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-slate-600 bg-white/60 px-2 py-0.5 rounded-full">
                {resolveLevelLabel(profile.level, t, 'long')}
              </span>
              <GradeBadge grade={profile.grade} />
            </div>
          </div>
        </div>

        {subscriptionQuery.data?.active && subscriptionQuery.data.expires_at && (
          <p className="text-xs font-semibold text-slate-500">
            {t('profile.subscriptionUntil', {
              date: formatLongDate(subscriptionQuery.data.expires_at),
            })}
          </p>
        )}

        {config ? (
          <SegmentedXpBar
            experience={profile.experience}
            canPromote={profile.can_promote}
            config={config}
          />
        ) : (
          <div className="text-xs text-slate-400">{profile.experience} XP</div>
        )}

        {profile.can_promote && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setPendingLevelChange('promote')}
              disabled={promoting || demoting}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-black text-base transition-colors shadow"
            >
              {promoting ? t('profile.promoting') : t('profile.promote', { level: nextLevelLabel })}
            </button>
            {promoteError && <p className="text-xs text-red-500 text-center">{promoteError}</p>}
          </div>
        )}

        {canDemote && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setPendingLevelChange('demote')}
              disabled={promoting || demoting}
              className="w-full py-3 rounded-2xl bg-slate-400 hover:bg-slate-500 disabled:opacity-60 text-white font-black text-base transition-colors shadow"
            >
              {demoting
                ? t('profile.demoting')
                : t('profile.demote', { level: previousLevelLabel })}
            </button>
            {demoteError && <p className="text-xs text-red-500 text-center">{demoteError}</p>}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-100 p-6 space-y-4">
        <h2 className="text-xl font-black text-slate-700">
          {t('profile.history')}{' '}
          <span className="text-base font-bold text-slate-400">
            {t('profile.gamesCount', { count: profile.history.length })}
          </span>
        </h2>

        {profile.history.length === 0 ? (
          <p className="text-slate-400 text-center py-8">{t('profile.noGames')}</p>
        ) : (
          <div className="space-y-3">
            {profile.history.map((entry) => (
              <HistoryRow
                key={entry.id}
                entry={entry}
                isExpanded={expandedEntries.has(entry.id)}
                onToggle={() => toggleEntry(entry.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="text-center space-y-1">
        <Link
          to="/progression"
          className="block text-sm font-bold text-slate-500 hover:text-primary transition-colors"
        >
          {t('profile.rewardsLink')}
        </Link>
        <Link
          to="/icons"
          className="block text-sm font-bold text-slate-500 hover:text-primary transition-colors"
        >
          {t('profile.iconsLink')}
        </Link>
      </div>

      <div className="pb-8">
        <DangerZone onDeleteRequest={() => setIsDeleteModalOpen(true)} />
      </div>

      {isDeleteModalOpen && (
        <DeleteAccountModal
          username={profile.username}
          isDeleting={accountDeletion.isPending}
          errorMessage={
            accountDeletion.isError ? deletionErrorMessage(accountDeletion.error, t) : null
          }
          onConfirm={handleDeleteAccount}
          onCancel={closeDeleteModal}
        />
      )}

      {pendingLevelChange != null && (
        <LevelChangeConfirmModal
          variant={pendingLevelChange}
          targetLevel={pendingLevelChange === 'promote' ? nextLevelLabel : previousLevelLabel}
          currentLevel={resolveLevelLabel(profile.level, t, 'long')}
          onConfirm={() => {
            setPendingLevelChange(null);
            if (pendingLevelChange === 'promote') {
              handlePromote();
            } else {
              handleDemote();
            }
          }}
          onCancel={() => setPendingLevelChange(null)}
        />
      )}
    </div>
  );
};
