import React, { useId } from 'react';
import { Crown, FlameSilhouette, FlameSvg, Glow, Particles } from './parts';
import type { FlameProps } from './tiers';

export const GoldFlame: React.FC<FlameProps> = ({ size = 22, animated = true }) => {
  const id = useId();
  const gradId = `gold-${id}`;
  const glowId = `gold-glow-${id}`;
  return (
    <FlameSvg tier="gold" size={size}>
      <defs>
        <linearGradient id={gradId} x1="12" y1="3" x2="12" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fef9c3" />
          <stop offset="0.5" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <radialGradient id={glowId} cx="0.5" cy="0.55" r="0.7">
          <stop offset="0" stopColor="#fde047" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fde047" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Glow gradientId={glowId} animated={animated} />
      <FlameSilhouette gradientId={gradId} animated={animated} />
      <Particles color="#fef08a" animated={animated} />
      <Crown animated={animated} />
    </FlameSvg>
  );
};
