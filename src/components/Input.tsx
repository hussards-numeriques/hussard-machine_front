import React from 'react';
import { cn } from '../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full text-center text-2xl p-4 rounded-xl border-2 border-slate-300',
          'focus:border-primary focus:ring-4 focus:ring-primary-light outline-none transition-all',
          'placeholder:text-slate-400',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
