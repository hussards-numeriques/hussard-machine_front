import React from 'react';
import { cn } from '../../lib/utils';

interface ComboBadgeProps {
  combo: number;
}

export const ComboBadge: React.FC<ComboBadgeProps> = ({ combo }) => {
  if (combo < 2) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 font-black',
        'bg-secondary/20 text-amber-600 animate-combo-grow'
      )}
    >
      <span aria-hidden>🔥</span>
      <span>x{combo}</span>
    </div>
  );
};
