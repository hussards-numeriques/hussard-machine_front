import React from 'react';
import { resolveGradeLabel } from '../../lib/grades';
import { useTranslation } from 'react-i18next';

interface GradeLabelRowSegment {
  grade: string;
  isCurrent: boolean;
}

export const GradeLabelRow: React.FC<{ segments: GradeLabelRowSegment[] }> = ({ segments }) => {
  const { t } = useTranslation();
  return (
    <div className="flex gap-1">
      {segments.map((segment) => (
        <div key={segment.grade} className="flex-1 text-center">
          <span
            className={`text-xs font-bold ${segment.isCurrent ? 'text-slate-800' : 'text-slate-400'}`}
          >
            {resolveGradeLabel(segment.grade, t)}
          </span>
        </div>
      ))}
    </div>
  );
};
