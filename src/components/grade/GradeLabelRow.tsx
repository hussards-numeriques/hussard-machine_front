import React from 'react';
import { resolveGradeLabel } from '../../lib/grades';

interface GradeLabelRowSegment {
  grade: string;
  isCurrent: boolean;
}

export const GradeLabelRow: React.FC<{ segments: GradeLabelRowSegment[] }> = ({ segments }) => (
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
);
