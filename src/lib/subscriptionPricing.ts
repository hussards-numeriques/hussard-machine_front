import type { SubscriptionPlanKey } from '../services/subscription';

const MONTHS_BY_PLAN: Record<SubscriptionPlanKey, number> = {
  ONE_MONTH: 1,
  THREE_MONTHS: 3,
  ONE_YEAR: 12,
};

export function monthsForPlan(key: SubscriptionPlanKey): number {
  return MONTHS_BY_PLAN[key];
}

export function computeMonthlyEquivalentCents(amount: number, key: SubscriptionPlanKey): number {
  return Math.round(amount / monthsForPlan(key));
}

export function computeSavingsPercent(
  amount: number,
  key: SubscriptionPlanKey,
  baselineMonthlyAmount: number | undefined
): number | null {
  if (baselineMonthlyAmount === undefined) {
    return null;
  }
  const exactMonthlyEquivalent = amount / monthsForPlan(key);
  return Math.round((1 - exactMonthlyEquivalent / baselineMonthlyAmount) * 100);
}
