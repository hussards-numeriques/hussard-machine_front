import React from 'react';
import type { GameConfig } from '../../types';
import { resolveGradeBarColor, resolveGradeLabel } from '../../lib/grades';
import { computeGradeProgress } from '../../lib/gradeProgress';

export const SegmentedXpBar: React.FC<{
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
