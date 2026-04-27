import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { GameConfig } from '../types';

const getApiUrl = (): string => {
  const url = import.meta.env.VITE_API_URL ?? '';
  return typeof url === 'string' && url.endsWith('/') ? url.slice(0, -1) : (url as string);
};

const GRADE_LABELS: Record<string, string> = {
  BRONZE: 'Bronze',
  SILVER: 'Argent',
  GOLD: 'Or',
  PLATINE: 'Platine',
  DIAMOND: 'Diamant',
};

const GRADE_STYLES: Record<string, string> = {
  BRONZE: 'bg-amber-100 text-amber-800 border-amber-300',
  SILVER: 'bg-slate-100 text-slate-600 border-slate-300',
  GOLD: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  PLATINE: 'bg-violet-100 text-violet-700 border-violet-300',
  DIAMOND: 'bg-cyan-100 text-cyan-700 border-cyan-300',
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

export const HowItWorksPage: React.FC = () => {
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/game/config`);
        if (response.ok) {
          const data = (await response.json()) as GameConfig;
          setConfig(data);
        }
      } finally {
        setLoading(false);
      }
    };
    void fetchConfig();
  }, []);

  return (
    <div className="min-h-screen p-4 pt-20 max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-100 p-8 space-y-6">
        <h1 className="text-3xl font-black text-primary-dark">Comment ça marche ?</h1>

        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-700">La progression</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Chaque partie te rapporte (ou te coûte) de l'expérience (XP). En gagnant de l'XP, tu
            montes en <strong>grade</strong> au sein de ton <strong>niveau</strong>. Une fois le
            grade maximum atteint, tu peux choisir de passer au niveau supérieur.
          </p>
        </section>

        {loading && (
          <div className="text-slate-400 text-sm animate-pulse">Chargement des seuils...</div>
        )}

        {config && (
          <>
            <section className="space-y-3">
              <h2 className="text-xl font-black text-slate-700">Les grades</h2>
              <p className="text-slate-500 text-xs">
                Chaque grade demande {config.experience_per_grade} XP. La promotion de niveau est
                disponible à {config.promotion_threshold} XP.
              </p>
              <div className="flex flex-wrap gap-2">
                {config.grades.map((grade, i) => (
                  <div
                    key={grade}
                    className={`flex items-center gap-2 px-3 py-2 rounded-2xl border ${GRADE_STYLES[grade] ?? 'bg-slate-100 border-slate-200'}`}
                  >
                    <span className="font-black text-sm">{GRADE_LABELS[grade] ?? grade}</span>
                    <span className="text-xs opacity-70">{i * config.experience_per_grade} XP</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-black text-slate-700">Les niveaux</h2>
              <p className="text-slate-500 text-xs">
                Il y a {config.levels.length} niveaux. On commence au CP et on peut progresser
                jusqu'en Terminale. Chaque promotion remet l'XP à zéro.
              </p>
              <div className="flex flex-wrap gap-2">
                {config.levels.map((level) => (
                  <span
                    key={level}
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20"
                  >
                    {LEVEL_LABELS[level] ?? level}
                  </span>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <div className="text-center pb-8">
        <Link
          to="/profile"
          className="text-sm font-bold text-slate-400 hover:text-primary transition-colors"
        >
          ← Retour au profil
        </Link>
      </div>
    </div>
  );
};
