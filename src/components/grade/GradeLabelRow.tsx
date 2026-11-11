import React from 'react';
import { resolveGradeLabel, resolveGradeMetal } from '../../lib/grades';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';

interface GradeLabelRowSegment {
  grade: string;
  isCurrent: boolean;
}

interface GradeLabelRowProps {
  segments: GradeLabelRowSegment[];
  poppedGrade?: string;
}

export const GradeLabelRow: React.FC<GradeLabelRowProps> = ({ segments, poppedGrade }) => {
  const { t } = useTranslation();
  return (
    <div className="flex gap-1">
      {segments.map((segment) => (
        <div key={segment.grade} className="flex-1 text-center">
          <span
            className={cn(
              'inline-block text-xs font-bold transition-colors',
              segment.isCurrent ? 'text-slate-800' : 'text-slate-400',
              segment.grade === poppedGrade &&
                cn(
                  'font-black motion-safe:animate-grade-label-pop',
                  resolveGradeMetal(segment.grade)
                )
            )}
            style={segment.grade === poppedGrade ? { color: 'var(--metal-dark)' } : undefined}
          >
            {resolveGradeLabel(segment.grade, t)}
          </span>
        </div>
      ))}
    </div>
  );
};
