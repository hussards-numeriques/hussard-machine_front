import React, { useId } from 'react';
import { FlameSilhouette, FlameSvg } from './parts';
import type { FlameProps } from './tiers';

export const OrangeFlame: React.FC<FlameProps> = ({ size = 22, animated = true }) => {
  const id = useId();
  const gradId = `orange-${id}`;
  return (
    <FlameSvg tier="orange" size={size}>
      <defs>
        <linearGradient id={gradId} x1="12" y1="3" x2="12" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="0.6" stopColor="#f97316" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <FlameSilhouette gradientId={gradId} animated={animated} />
    </FlameSvg>
  );
};
