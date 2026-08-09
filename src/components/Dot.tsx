import React from 'react';
import { cn } from '../lib/utils';

export type DotVariant = 'success' | 'danger' | 'neutral';

const DOT_VARIANT_STYLES: Record<DotVariant, string> = {
  success: 'bg-emerald-500',
  danger: 'bg-red-400',
  neutral: 'bg-slate-300',
};

interface DotProps {
  variant: DotVariant;
  label?: string;
}

export const Dot: React.FC<DotProps> = ({ variant, label }) => (
  <span
    data-testid="dot"
    role={label ? 'img' : undefined}
    aria-label={label}
    className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOT_VARIANT_STYLES[variant])}
  />
);
