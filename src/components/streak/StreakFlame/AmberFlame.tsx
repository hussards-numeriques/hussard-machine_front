import React, { useId } from 'react';
import { FlameSilhouette, FlameSvg, Glow } from './parts';
import type { FlameProps } from './tiers';

export const AmberFlame: React.FC<FlameProps> = ({ size = 22, animated = true }) => {
  const id = useId();
  const gradId = `amber-${id}`;
  const glowId = `amber-glow-${id}`;
  return (
    <FlameSvg tier="amber" size={size}>
      <defs>
        <linearGradient id={gradId} x1="12" y1="3" x2="12" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.6" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <radialGradient id={glowId} cx="0.5" cy="0.6" r="0.6">
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.7" />
          <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Glow gradientId={glowId} animated={animated} />
      <FlameSilhouette gradientId={gradId} animated={animated} />
    </FlameSvg>
  );
};
