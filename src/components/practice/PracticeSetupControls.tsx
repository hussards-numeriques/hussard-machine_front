import React from 'react';
import { cn } from '../../lib/utils';

interface ChoiceButtonProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export const ChoiceButton: React.FC<ChoiceButtonProps> = ({
  selected,
  onClick,
  children,
  className,
  ariaLabel,
}) => (
  <button
    type="button"
    aria-pressed={selected}
    aria-label={ariaLabel}
    onClick={onClick}
    className={cn(
      'rounded-2xl border-2 px-3 py-3 font-bold transition-all active:scale-95',
      selected
        ? 'border-primary bg-primary/10 text-primary-dark shadow-md motion-safe:scale-[1.03]'
        : 'border-slate-200 bg-white text-slate-600 hover:border-primary-light',
      className
    )}
  >
    {children}
  </button>
);

export const Step: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({
  number,
  title,
  children,
}) => (
  <section className="space-y-3 animate-pop-in">
    <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-white">
        {number}
      </span>
      {title}
    </h2>
    {children}
  </section>
);
