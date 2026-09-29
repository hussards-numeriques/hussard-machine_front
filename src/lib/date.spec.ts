import { afterEach, describe, expect, it, vi } from 'vitest';
import { daysUntil, formatLongDate, formatShortDate } from './date';

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

describe('formatLongDate', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('formats an ISO date as "D month year" in French', () => {
    expect(formatLongDate('2026-08-21T12:00:00')).toBe('21 août 2026');
  });

  it('does not pad the day (long format never shows a leading zero)', () => {
    expect(formatLongDate('2026-01-05T00:00:00')).toBe('5 janvier 2026');
  });

  it('does not double-append Z when the ISO string already carries an offset', () => {
    expect(formatLongDate('2026-08-21T23:30:00+02:00')).toBe('21 août 2026');
  });

  it('displays the UTC calendar day of an offset-aware string no matter the viewer local timezone', () => {
    vi.stubEnv('TZ', 'Asia/Tokyo');
    expect(formatLongDate('2026-08-21T23:30:00+02:00')).toBe('21 août 2026');
  });

  it('treats a naive (no-timezone) ISO string as UTC regardless of the runner local timezone', () => {
    vi.stubEnv('TZ', 'Asia/Tokyo');
    expect(formatLongDate('2026-08-21T23:30:00')).toBe('21 août 2026');
  });
});

describe('daysUntil', () => {
  const now = new Date('2026-09-29T12:00:00Z');

  it('rounds a partial day up so an expiry tomorrow morning reads as 1 day', () => {
    expect(daysUntil('2026-09-30T00:00:00Z', now)).toBe(1);
  });

  it('never goes negative once the date has passed', () => {
    expect(daysUntil('2026-09-01T00:00:00Z', now)).toBe(0);
  });

  it('treats a naive ISO string as UTC', () => {
    expect(daysUntil('2026-10-02T12:00:00', now)).toBe(3);
  });
});
