import type { ComponentType } from 'react';
import { AmberFlame } from './AmberFlame';
import { BlueFlame } from './BlueFlame';
import { EmberFlame } from './EmberFlame';
import { GoldFlame } from './GoldFlame';
import { OrangeFlame } from './OrangeFlame';
import { VioletFlame } from './VioletFlame';

export interface FlameProps {
  size?: number;
  animated?: boolean;
  muted?: boolean;
}

export type TierId = 'ember' | 'orange' | 'amber' | 'blue' | 'violet' | 'gold';

export interface StreakTier {
  id: TierId;
  min: number;
  Flame: ComponentType<FlameProps>;
  valueColorClass: string;
}

export const STREAK_TIERS: StreakTier[] = [
  { id: 'gold', min: 60, Flame: GoldFlame, valueColorClass: 'text-amber-500' },
  { id: 'violet', min: 30, Flame: VioletFlame, valueColorClass: 'text-violet-600' },
  { id: 'blue', min: 14, Flame: BlueFlame, valueColorClass: 'text-sky-500' },
  { id: 'amber', min: 7, Flame: AmberFlame, valueColorClass: 'text-amber-500' },
  { id: 'orange', min: 3, Flame: OrangeFlame, valueColorClass: 'text-orange-500' },
  { id: 'ember', min: 1, Flame: EmberFlame, valueColorClass: 'text-orange-400' },
];

export function getStreakTier(count: number): StreakTier {
  return STREAK_TIERS.find((tier) => count >= tier.min) ?? STREAK_TIERS[STREAK_TIERS.length - 1];
}
