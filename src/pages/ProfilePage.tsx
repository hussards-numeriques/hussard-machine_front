import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import type { GameConfig, GameHistoryEntry, PlayerProfile } from '../types';

const getApiUrl = (): string => {
  const url = import.meta.env.VITE_API_URL ?? '';
  return typeof url === 'string' && url.endsWith('/') ? url.slice(0, -1) : (url as string);
};

const GRADE_STYLES: Record<string, string> = {
  BRONZE: 'bg-amber-100 text-amber-800 border-amber-300',
  SILVER: 'bg-slate-100 text-slate-600 border-slate-300',
  GOLD: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  PLATINE: 'bg-violet-100 text-violet-700 border-violet-300',
  DIAMOND: 'bg-cyan-100 text-cyan-700 border-cyan-300',
};

const GRADE_BAR_COLORS: Record<string, string> = {
  BRONZE: 'bg-amber-400',
  SILVER: 'bg-slate-400',
  GOLD: 'bg-yellow-400',
  PLATINE: 'bg-violet-400',
  DIAMOND: 'bg-cyan-400',
};

const GRADE_LABELS: Record<string, string> = {
  BRONZE: 'Bronze',
  SILVER: 'Argent',
  GOLD: 'Or',
  PLATINE: 'Platine',
  DIAMOND: 'Diamant',
};

const LEVEL_LABELS: Record<string, string> = {
  CP: 'CP',
  CE1: 'CE1',
  CE2: 'CE2',
  CM1: 'CM1',
  CM2: 'CM2',
  SIXIEME: '6ème',
  CINQUIEME: '5ème',
  QUATRIEME: '4ème',
  TROISIEME: '3ème',
  SECONDE: 'Seconde',
  PREMIERE: '1ère',
  TERMINALE: 'Terminale',
};

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
    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${GRADE_STYLES[grade] ?? 'bg-slate-100 text-slate-600 border-slate-300'}`}
  >
    {GRADE_LABELS[grade] ?? grade}
  </span>
);

const SegmentedXpBar: React.FC<{
  experience: number;
  canPromote: boolean;
  config: GameConfig;
}> = ({ experience, canPromote, config }) => {
  const gradeIndex = Math.min(
    Math.floor(experience / config.experience_per_grade),
    config.grades.length - 1
  );
  const progressInGrade = canPromote
    ? config.experience_per_grade
    : experience % config.experience_per_grade;

  const nextGrade = config.grades[gradeIndex + 1];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {config.grades.map((grade, i) => (
          <div key={grade} className="flex-1 text-center">
            <span
              className={`text-xs font-bold ${i === gradeIndex ? 'text-slate-800' : 'text-slate-400'}`}
            >
              {GRADE_LABELS[grade] ?? grade}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        {config.grades.map((grade, i) => {
          let fill = 0;
          if (i < gradeIndex) {
            fill = 100;
          } else if (i === gradeIndex) {
            fill = (progressInGrade / config.experience_per_grade) * 100;
          }
          return (
            <div
              key={grade}
              className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200"
            >
              <div
                className={`h-full rounded-full transition-all ${GRADE_BAR_COLORS[grade] ?? 'bg-primary'}`}
                style={{ width: `${fill}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{experience} XP</span>
        {canPromote ? (
          <span className="font-bold text-emerald-600 animate-pulse">
            ✨ Grade max — promotion disponible !
          </span>
        ) : nextGrade != null ? (
          <span>
            {config.experience_per_grade - progressInGrade} XP pour{' '}
            {GRADE_LABELS[nextGrade] ?? nextGrade}
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

export const ProfilePage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading, client } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/game/config`);
        if (response.ok) {
          const data = (await response.json()) as GameConfig;
          setConfig(data);
        }
      } catch {
        // config non critique, on continue sans
      }
    };
    void fetchConfig();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await client.authorizedFetch(`${getApiUrl()}/me/details`);
        if (response.status === 404) {
          setError('Compte introuvable. Rejoins une partie pour créer ton profil !');
          return;
        }
        if (!response.ok) {
          setError('Impossible de charger ton profil.');
          return;
        }
        const data = (await response.json()) as PlayerProfile;
        setProfile(data);
      } catch {
        setError('Erreur réseau, réessaie plus tard.');
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, [isAuthenticated, authLoading, client]);

  const handlePromote = async () => {
    setPromoting(true);
    setPromoteError(null);
    try {
      const response = await client.authorizedFetch(`${getApiUrl()}/me/promote`, {
        method: 'POST',
      });
      if (!response.ok) {
        setPromoteError('La promotion a échoué. Réessaie.');
        return;
      }
      const refreshed = await client.authorizedFetch(`${getApiUrl()}/me/details`);
      if (refreshed.ok) {
        const data = (await refreshed.json()) as PlayerProfile;
        setProfile(data);
      }
    } catch {
      setPromoteError('Erreur réseau.');
    } finally {
      setPromoting(false);
    }
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-lg font-bold animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
          <h1 className="text-3xl font-black text-primary-dark">Profil</h1>
          <p className="text-slate-600">Connecte-toi pour voir ton profil.</p>
          <Link to="/" className="inline-block text-primary font-bold hover:underline">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  if (error ?? !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
          <h1 className="text-3xl font-black text-primary-dark">Profil</h1>
          <p className="text-slate-500">{error ?? 'Données indisponibles.'}</p>
          <Link to="/" className="inline-block text-primary font-bold hover:underline">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const gradeStyle = GRADE_STYLES[profile.grade];
  const gradeBg = gradeStyle?.split(' ')[0] ?? 'bg-slate-100';
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
                {LEVEL_LABELS[profile.level] ?? profile.level}
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
              onClick={() => void handlePromote()}
              disabled={promoting}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-black text-base transition-colors shadow"
            >
              {promoting
                ? 'Promotion en cours...'
                : `Monter en ${LEVEL_LABELS[nextLevelKey ?? ''] ?? nextLevelKey ?? 'niveau suivant'}`}
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
          Comment fonctionne le système de grades ? →
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
