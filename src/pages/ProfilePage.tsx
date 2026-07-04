import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import type { GameConfig, GameHistoryEntry } from '../types';
import { ApiError } from '../services/http';
import { useGameConfig } from '../hooks/useGameConfig';
import { usePlayerProfile, usePromotePlayer } from '../hooks/usePlayerProfile';
import {
  resolveGradeBarColor,
  resolveGradeLabel,
  resolveGradeStyle,
  resolveLevelLabel,
} from '../lib/grades';
import { computeGradeProgress } from '../lib/gradeProgress';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
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

const GradeBadge: React.FC<{ grade: string }> = ({ grade }) => (
  <span
    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${resolveGradeStyle(grade)}`}
  >
    {resolveGradeLabel(grade)}
  </span>
);

const SegmentedXpBar: React.FC<{
  experience: number;
  canPromote: boolean;
  config: GameConfig;
}> = ({ experience, canPromote, config }) => {
  const { nextGrade, xpToNextGrade, segments } = computeGradeProgress(
    experience,
    canPromote,
    config
  );

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {segments.map((segment) => (
          <div key={segment.grade} className="flex-1 text-center">
            <span
              className={`text-xs font-bold ${segment.isCurrent ? 'text-slate-800' : 'text-slate-400'}`}
            >
              {resolveGradeLabel(segment.grade)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        {segments.map((segment) => (
          <div
            key={segment.grade}
            className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200"
          >
            <div
              className={`h-full rounded-full transition-all ${resolveGradeBarColor(segment.grade)}`}
              style={{ width: `${segment.fillPercent}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{experience} XP</span>
        {canPromote ? (
          <span className="font-bold text-emerald-600 animate-pulse">
            ✨ Grade max — promotion disponible !
          </span>
        ) : nextGrade != null ? (
          <span>
            {xpToNextGrade} XP pour {resolveGradeLabel(nextGrade)}
          </span>
        ) : null}
      </div>
    </div>
  );
};

const HistoryRow: React.FC<{
  entry: GameHistoryEntry;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ entry, isExpanded, onToggle }) => {
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
                Rapide
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {entry.my_correct_answers}/{entry.my_total_answers} bonnes réponses · {entry.my_score}{' '}
            pts · {formatDuration(entry.duration_seconds)}
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
                <th className="text-left py-1">Rang</th>
                <th className="text-left py-1">Joueur</th>
                <th className="text-right py-1">Réponses</th>
                <th className="text-right py-1">Points</th>
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
                        <span className="ml-1 text-xs font-normal text-violet-400">(bot)</span>
                      )}
                    </span>
                  </td>
                  <td className="py-1.5 text-right text-slate-500">
                    {p.correct_answers}/{p.total_answers}
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

const ProfileNotice: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
      <h1 className="text-3xl font-black text-primary-dark">Profil</h1>
      <p className="text-slate-600">{message}</p>
      <Link to="/" className="inline-block text-primary font-bold hover:underline">
        Retour à l'accueil
      </Link>
    </div>
  </div>
);

const profileErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.status === 404) {
    return 'Compte introuvable. Rejoins une partie pour créer ton profil !';
  }
  if (error instanceof ApiError) {
    return 'Impossible de charger ton profil.';
  }
  return 'Erreur réseau, réessaie plus tard.';
};

export const ProfilePage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: config } = useGameConfig();
  const profileQuery = usePlayerProfile();
  const promotion = usePromotePlayer();
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const profile = profileQuery.data;
  const promoting = promotion.isPending;
  const promoteError = promotion.isError
    ? promotion.error instanceof ApiError
      ? 'La promotion a échoué. Réessaie.'
      : 'Erreur réseau.'
    : null;

  const handlePromote = () => {
    promotion.mutate();
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
        <div className="text-slate-400 text-lg font-bold animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <ProfileNotice message="Connecte-toi pour voir ton profil." />;
  }

  if (!profile) {
    return (
      <ProfileNotice
        message={
          profileQuery.isError ? profileErrorMessage(profileQuery.error) : 'Données indisponibles.'
        }
      />
    );
  }

  const gradeBg = resolveGradeStyle(profile.grade).split(' ')[0];
  const nextLevelKey = config ? config.levels[config.levels.indexOf(profile.level) + 1] : undefined;

  return (
    <div className="min-h-screen p-4 pt-20 max-w-2xl mx-auto space-y-6">
      <div className={`${gradeBg} rounded-3xl p-8 space-y-5 border-2 border-white shadow-lg`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-black shadow-md">
            {profile.username.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">{profile.username}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-slate-600 bg-white/60 px-2 py-0.5 rounded-full">
                {resolveLevelLabel(profile.level)}
              </span>
              <GradeBadge grade={profile.grade} />
            </div>
          </div>
        </div>

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
              onClick={handlePromote}
              disabled={promoting}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-black text-base transition-colors shadow"
            >
              {promoting
                ? 'Promotion en cours...'
                : `Monter en ${nextLevelKey != null ? resolveLevelLabel(nextLevelKey) : 'niveau suivant'}`}
            </button>
            {promoteError && <p className="text-xs text-red-500 text-center">{promoteError}</p>}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-100 p-6 space-y-4">
        <h2 className="text-xl font-black text-slate-700">
          Historique{' '}
          <span className="text-base font-bold text-slate-400">
            ({profile.history.length} partie{profile.history.length > 1 ? 's' : ''})
          </span>
        </h2>

        {profile.history.length === 0 ? (
          <p className="text-slate-400 text-center py-8">
            Aucune partie jouée pour l'instant. À toi de jouer !
          </p>
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

      <div className="text-center space-y-2 pb-8">
        <Link
          to="/how-it-works"
          className="block text-sm font-bold text-slate-500 hover:text-primary transition-colors"
        >
          Aide & FAQ : grades, séries… →
        </Link>
        <Link
          to="/"
          className="block text-sm font-bold text-slate-400 hover:text-primary transition-colors"
        >
          ← Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};
