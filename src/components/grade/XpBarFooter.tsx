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
        <span className="font-bold text-emerald-600 animate-pulse">
          ✨ Grade max — promotion disponible !
        </span>
      ) : nextGrade != null ? (
        <span>
          {xpToNextGrade} XP pour {resolveGradeLabel(nextGrade, t)}
        </span>
      ) : null}
    </div>
  );
};
