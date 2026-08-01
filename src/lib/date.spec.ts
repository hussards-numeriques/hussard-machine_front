import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatShortDate } from './date';

describe('formatShortDate', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('formats an ISO date as DD/MM', () => {
    expect(formatShortDate('2026-08-21T12:00:00')).toBe('21/08');
  });

  it('pads single-digit day and month', () => {
    expect(formatShortDate('2026-01-05T00:00:00')).toBe('05/01');
  });

  it('does not double-append Z when the ISO string already carries an offset', () => {
    expect(formatShortDate('2026-08-21T23:30:00+02:00')).toBe('21/08');
  });

  it('displays the UTC calendar day of an offset-aware string no matter the viewer local timezone', () => {
    vi.stubEnv('TZ', 'Asia/Tokyo');
    expect(formatShortDate('2026-08-21T23:30:00+02:00')).toBe('21/08');
  });

  it('treats a naive (no-timezone) ISO string as UTC regardless of the runner local timezone', () => {
    vi.stubEnv('TZ', 'Asia/Tokyo');
    expect(formatShortDate('2026-08-21T23:30:00')).toBe('21/08');
  });
});
