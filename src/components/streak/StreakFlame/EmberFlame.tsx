import React, { useId } from 'react';
import { FlameSilhouette, FlameSvg } from './parts';
import type { FlameProps } from './tiers';

export const EmberFlame: React.FC<FlameProps> = ({ size = 22, animated = true, muted = false }) => {
  const id = useId();
  const gradId = `ember-${id}`;
  return (
    <FlameSvg tier="ember" size={size}>
      <defs>
        <linearGradient id={gradId} x1="12" y1="3" x2="12" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={muted ? '#cbd5e1' : '#fdba74'} />
          <stop offset="1" stopColor={muted ? '#94a3b8' : '#f97316'} />
        </linearGradient>
      </defs>
      <g opacity={muted ? 0.5 : 0.9}>
        <FlameSilhouette gradientId={gradId} animated={animated && !muted} />
      </g>
    </FlameSvg>
  );
};
