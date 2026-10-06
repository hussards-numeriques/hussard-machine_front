import React from 'react';
import { resolveGradeLabel, resolveGradeStyle, resolveLevelLabel } from '../../lib/grades';
import { useGameConfig } from '../../hooks/useGameConfig';
import { Trans, useTranslation } from 'react-i18next';

export const GradeGuide: React.FC = () => {
  const { t } = useTranslation();
  const { data: config, isLoading: loading } = useGameConfig();

  return (
    <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-100 p-8 space-y-6">
      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-700">{t('grade.guide.progressionTitle')}</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          <Trans i18nKey="grade.guide.progressionText" components={{ strong: <strong /> }} />
        </p>
      </section>

      {loading && (
        <div className="text-slate-400 text-sm animate-pulse">
          {t('grade.guide.loadingThresholds')}
        </div>
      )}

      {config && (
        <>
          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-700">{t('grade.guide.gradesTitle')}</h2>
            <p className="text-slate-500 text-xs">
              {t('grade.guide.gradesText', {
                xp: config.experience_per_grade,
                threshold: config.promotion_threshold,
              })}
            </p>
            <div className="flex flex-wrap gap-2">
              {config.grades.map((grade, i) => (
                <div
                  key={grade}
                  className={`flex items-center gap-2 px-3 py-2 rounded-2xl border ${resolveGradeStyle(grade)}`}
                >
                  <span className="font-black text-sm">{resolveGradeLabel(grade, t)}</span>
                  <span className="text-xs opacity-70">{i * config.experience_per_grade} XP</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-700">{t('grade.guide.levelsTitle')}</h2>
            <p className="text-slate-500 text-xs">
              {t('grade.guide.levelsText', {
                total: config.levels.length,
                first: resolveLevelLabel(config.levels[0], t, 'long'),
                last: resolveLevelLabel(config.levels[config.levels.length - 1], t, 'long'),
              })}
            </p>
            <div className="flex flex-wrap gap-2">
              {config.levels.map((level) => (
                <span
                  key={level}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20"
                >
                  {resolveLevelLabel(level, t, 'long')}
                </span>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
