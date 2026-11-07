import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { computeRemainingSeconds, useCountdown } from './useCountdown';

const T = 1_700_000_000;

describe('computeRemainingSeconds', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T * 1000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the full duration when there is no start time', () => {
    expect(computeRemainingSeconds(12, null)).toBe(12);
  });

  it('rounds the remaining time up', () => {
    expect(computeRemainingSeconds(10, T - 3.5)).toBe(7);
  });

  it('never goes below zero', () => {
    expect(computeRemainingSeconds(10, T - 20)).toBe(0);
  });
});

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T * 1000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null without a duration', () => {
    const { result } = renderHook(() => useCountdown(null, T));
    expect(result.current).toBeNull();
  });

  it('counts down as time passes', () => {
    const { result } = renderHook(() => useCountdown(5, T));
    expect(result.current).toBe(5);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current).toBe(3);
  });
});
