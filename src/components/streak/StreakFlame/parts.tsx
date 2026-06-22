import React from 'react';
import { cn } from '../../../lib/utils';
import { FLAME_PATH } from './flamePath';

export const FlameSilhouette: React.FC<{ gradientId: string; animated?: boolean }> = ({
  gradientId,
  animated,
}) => (
  <path
    d={FLAME_PATH}
    fill={`url(#${gradientId})`}
    className={cn('origin-bottom', animated && 'animate-flame-flicker')}
  />
);

export const Glow: React.FC<{ gradientId: string; animated?: boolean }> = ({
  gradientId,
  animated,
}) => (
  <circle
    cx="12"
    cy="14"
    r="11"
    fill={`url(#${gradientId})`}
    className={cn(animated && 'animate-glow-pulse')}
  />
);

const PARTICLES = [
  { cx: 9, cy: 9, r: 0.8, delay: '0s' },
  { cx: 15, cy: 7.5, r: 0.9, delay: '0.6s' },
  { cx: 12, cy: 5.5, r: 0.7, delay: '1.1s' },
];

export const Particles: React.FC<{ color: string; animated?: boolean }> = ({ color, animated }) => (
  <g fill={color}>
    {PARTICLES.map((p) => (
      <circle
        key={`${p.cx}-${p.cy}`}
        cx={p.cx}
        cy={p.cy}
        r={p.r}
        className={cn(animated && 'animate-particle-rise')}
        style={animated ? { animationDelay: p.delay } : undefined}
      />
    ))}
  </g>
);

export const Crown: React.FC<{ animated?: boolean }> = ({ animated }) => (
  <path
    d="M8 4.2l1.6 2L12 3.8l2.4 2.4 1.6-2-.7 3.4H8.7L8 4.2z"
    fill="#fcd34d"
    stroke="#f59e0b"
    strokeWidth="0.4"
    className={cn(animated && 'animate-gold-shimmer')}
  />
);

export const FlameSvg: React.FC<{
  tier: string;
  size: number;
  children: React.ReactNode;
}> = ({ tier, size, children }) => (
  <svg
    data-tier={tier}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    {children}
  </svg>
);
