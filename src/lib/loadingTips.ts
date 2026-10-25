export type LoadingTipId = 'inputMode' | 'levelUp' | 'language';

interface LoadingTipWeight {
  id: LoadingTipId;
  weight: number;
}

const LOADING_TIP_WEIGHTS: readonly LoadingTipWeight[] = [
  { id: 'inputMode', weight: 3 },
  { id: 'levelUp', weight: 2 },
  { id: 'language', weight: 1 },
];

const TOTAL_WEIGHT = LOADING_TIP_WEIGHTS.reduce((sum, tip) => sum + tip.weight, 0);

export const pickLoadingTip = (random: () => number = Math.random): LoadingTipId => {
  const target = random() * TOTAL_WEIGHT;
  let cumulative = 0;
  for (const tip of LOADING_TIP_WEIGHTS) {
    cumulative += tip.weight;
    if (target < cumulative) return tip.id;
  }
  return LOADING_TIP_WEIGHTS[LOADING_TIP_WEIGHTS.length - 1].id;
};
