import React from 'react';
import { resolveGradeLabel, resolveGradeStyle, resolveLevelLabel } from '../../lib/grades';
import { useGameConfig } from '../../hooks/useGameConfig';

export const GradeGuide: React.FC = () => {
  const { data: config, isLoading: loading } = useGameConfig();

  return (
    <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-100 p-8 space-y-6">
      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-700">La progression</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Chaque partie te rapporte (ou te coûte) de l'expérience (XP). En gagnant de l'XP, tu
          montes en <strong>grade</strong> au sein de ton <strong>niveau</strong>. Une fois le grade
          maximum atteint, tu peux choisir de passer au niveau supérieur.
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-2xl border ${resolveGradeStyle(grade)}`}
                >
                  <span className="font-black text-sm">{resolveGradeLabel(grade)}</span>
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
                  {resolveLevelLabel(level)}
                </span>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
