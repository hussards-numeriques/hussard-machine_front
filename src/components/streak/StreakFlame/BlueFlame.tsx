import React, { useId } from 'react';
import { FlameSilhouette, FlameSvg, Glow, Particles } from './parts';
import type { FlameProps } from './tiers';

export const BlueFlame: React.FC<FlameProps> = ({ size = 22, animated = true }) => {
  const id = useId();
  const gradId = `blue-${id}`;
  const glowId = `blue-glow-${id}`;
  return (
    <FlameSvg tier="blue" size={size}>
      <defs>
        <linearGradient id={gradId} x1="12" y1="3" x2="12" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#bae6fd" />
          <stop offset="0.55" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <radialGradient id={glowId} cx="0.5" cy="0.6" r="0.6">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0.75" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Glow gradientId={glowId} animated={animated} />
      <FlameSilhouette gradientId={gradId} animated={animated} />
      <Particles color="#e0f2fe" animated={animated} />
    </FlameSvg>
  );
};
