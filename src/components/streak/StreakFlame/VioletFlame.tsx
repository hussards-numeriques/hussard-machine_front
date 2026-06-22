import React, { useId } from 'react';
import { FlameSilhouette, FlameSvg, Glow, Particles } from './parts';
import type { FlameProps } from './tiers';

export const VioletFlame: React.FC<FlameProps> = ({ size = 22, animated = true }) => {
  const id = useId();
  const gradId = `violet-${id}`;
  const glowId = `violet-glow-${id}`;
  return (
    <FlameSvg tier="violet" size={size}>
      <defs>
        <linearGradient id={gradId} x1="12" y1="3" x2="12" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e9d5ff" />
          <stop offset="0.5" stopColor="#a855f7" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <radialGradient id={glowId} cx="0.5" cy="0.55" r="0.65">
          <stop offset="0" stopColor="#c084fc" stopOpacity="0.85" />
          <stop offset="1" stopColor="#c084fc" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Glow gradientId={glowId} animated={animated} />
      <FlameSilhouette gradientId={gradId} animated={animated} />
      <Particles color="#f3e8ff" animated={animated} />
    </FlameSvg>
  );
};
