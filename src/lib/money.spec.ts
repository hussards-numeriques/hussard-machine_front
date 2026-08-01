import { describe, expect, it } from 'vitest';
import { formatEuros } from './money';

describe('formatEuros', () => {
  it.each([
    [442, 'eur', '4,42 €'],
    [842, 'eur', '8,42 €'],
    [2718, 'eur', '27,18 €'],
    [100, 'eur', '1,00 €'],
  ])('formats %i cents (%s) as %s', (amountInCents, currency, expected) => {
    expect(formatEuros(amountInCents, currency)).toBe(expected);
  });
});
