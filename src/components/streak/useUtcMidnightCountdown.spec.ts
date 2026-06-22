import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUtcMidnightCountdown } from './useUtcMidnightCountdown';

describe('useUtcMidnightCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-22T23:59:58.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats the remaining time until UTC midnight as HH:MM:SS', () => {
    const { result } = renderHook(() => useUtcMidnightCountdown(true));
    expect(result.current).toBe('00:00:02');
  });

  it('ticks down every second while active', () => {
    const { result } = renderHook(() => useUtcMidnightCountdown(true));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe('00:00:01');
  });

  it('does not tick when inactive', () => {
    const { result } = renderHook(() => useUtcMidnightCountdown(false));
    const initial = result.current;
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current).toBe(initial);
  });
});
