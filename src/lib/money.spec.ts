import { describe, expect, it } from 'vitest';
import { formatEuros } from './money';

describe('formatEuros', () => {
  it.each([
    [442, 'eur', '4,42 €'],
    [842, 'eur', '8,42 €'],
    [2718, 'eur', '27,18 €'],
    [100, 'eur', '1,00 €'],
    [123456, 'eur', '1 234,56 €'],
  ])('formats %i cents (%s) as %s', (amountInCents, currency, expected) => {
    expect(formatEuros(amountInCents, currency)).toBe(expected);
  });

  it('normalizes the narrow no-break space thousands separator to a plain space', () => {
    const result = formatEuros(123456, 'eur');
    expect(result.includes(String.fromCodePoint(0x202f))).toBe(false);
    expect(result.includes(String.fromCodePoint(0xa0))).toBe(false);
  });
});
