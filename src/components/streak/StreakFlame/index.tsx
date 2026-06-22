import React from 'react';
import { getStreakTier, type FlameProps } from './tiers';

interface StreakFlameProps extends FlameProps {
  count: number;
}

export const StreakFlame: React.FC<StreakFlameProps> = ({ count, ...rest }) => {
  const { Flame } = getStreakTier(count);
  return <Flame {...rest} />;
};

// eslint-disable-next-line react-refresh/only-export-components
export { getStreakTier, STREAK_TIERS } from './tiers';
export type { FlameProps, StreakTier, TierId } from './tiers';
