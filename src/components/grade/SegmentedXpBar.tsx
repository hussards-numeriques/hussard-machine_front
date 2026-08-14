import React from 'react';
import type { GameConfig } from '../../types';
import { resolveGradeBarColor } from '../../lib/grades';
import { computeGradeProgress } from '../../lib/gradeProgress';
import { GradeLabelRow } from './GradeLabelRow';
import { XpBarFooter } from './XpBarFooter';

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
      <GradeLabelRow segments={segments} />
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
      <XpBarFooter
        experience={experience}
        canPromote={canPromote}
        nextGrade={nextGrade}
        xpToNextGrade={xpToNextGrade}
      />
    </div>
  );
};
