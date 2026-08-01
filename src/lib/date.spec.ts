import { describe, expect, it } from 'vitest';
import { formatShortDate } from './date';

describe('formatShortDate', () => {
  it('formats an ISO date as DD/MM', () => {
    expect(formatShortDate('2026-08-21T12:00:00')).toBe('21/08');
  });

  it('pads single-digit day and month', () => {
    expect(formatShortDate('2026-01-05T00:00:00')).toBe('05/01');
  });
});
