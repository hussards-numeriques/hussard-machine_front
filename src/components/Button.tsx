import React from 'react';
import { cn } from '../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}) => {
  const variants = {
    primary: 'bg-primary border-primary-dark text-white hover:bg-primary-dark/90',
    secondary: 'bg-secondary border-orange-400 text-yellow-950 hover:bg-secondary/90',
    danger: 'bg-rose-500 border-rose-700 text-white hover:bg-rose-600',
    success: 'bg-emerald-500 border-emerald-700 text-white hover:bg-emerald-600',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-xl',
  };

  return (
    <button
      className={cn(
        'rounded-xl font-bold border-b-4 active:border-b-0 active:translate-y-1 transition-all',
        variants[variant],
        sizes[size],
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:border-b-4',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
