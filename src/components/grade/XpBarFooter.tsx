import React from 'react';
import { resolveGradeLabel } from '../../lib/grades';
import { useTranslation } from 'react-i18next';

interface XpBarFooterProps {
  experience: number;
  canPromote: boolean;
  nextGrade: string | null;
  xpToNextGrade: number;
}

export const XpBarFooter: React.FC<XpBarFooterProps> = ({
  experience,
  canPromote,
  nextGrade,
  xpToNextGrade,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex justify-between text-xs text-slate-500">
      <span>{experience} XP</span>
      {canPromote ? (
        <span className="font-bold text-emerald-600 animate-pulse">{t('grade.maxGrade')}</span>
      ) : nextGrade != null ? (
        <span>
          {t('grade.xpToNext', { xp: xpToNextGrade, grade: resolveGradeLabel(nextGrade, t) })}
        </span>
      ) : null}
    </div>
  );
};
