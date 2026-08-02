import { describe, expect, it } from 'vitest';
import {
  computeMonthlyEquivalentCents,
  computeSavingsPercent,
  monthsForPlan,
} from './subscriptionPricing';

describe('monthsForPlan', () => {
  it('maps each plan key to its duration in months', () => {
    expect(monthsForPlan('ONE_MONTH')).toBe(1);
    expect(monthsForPlan('THREE_MONTHS')).toBe(3);
    expect(monthsForPlan('ONE_YEAR')).toBe(12);
  });
});

describe('computeMonthlyEquivalentCents', () => {
  it('divides the total amount by the plan duration, rounded to the nearest cent', () => {
    expect(computeMonthlyEquivalentCents(442, 'ONE_MONTH')).toBe(442);
    expect(computeMonthlyEquivalentCents(842, 'THREE_MONTHS')).toBe(281);
    expect(computeMonthlyEquivalentCents(2718, 'ONE_YEAR')).toBe(227);
  });
});

describe('computeSavingsPercent', () => {
  it('returns 0 for the baseline plan itself', () => {
    expect(computeSavingsPercent(442, 'ONE_MONTH', 442)).toBe(0);
  });

  it('computes the real Calc Rush pricing savings for 3 months and 1 year', () => {
    expect(computeSavingsPercent(842, 'THREE_MONTHS', 442)).toBe(37);
    expect(computeSavingsPercent(2718, 'ONE_YEAR', 442)).toBe(49);
  });

  it('returns null when there is no monthly baseline to compare against', () => {
    expect(computeSavingsPercent(842, 'THREE_MONTHS', undefined)).toBeNull();
  });
});
