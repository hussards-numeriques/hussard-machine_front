import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSoundEnabled, SOUND_ENABLED_STORAGE_KEY } from './useSoundEnabled';

describe('useSoundEnabled', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('is enabled by default', () => {
    const { result } = renderHook(() => useSoundEnabled());
    expect(result.current[0]).toBe(true);
  });

  it('persists a disabled choice', () => {
    const { result } = renderHook(() => useSoundEnabled());
    act(() => result.current[1](false));
    expect(result.current[0]).toBe(false);
    expect(localStorage.getItem(SOUND_ENABLED_STORAGE_KEY)).toBe('false');
  });

  it('shares state across hook instances', () => {
    const a = renderHook(() => useSoundEnabled());
    const b = renderHook(() => useSoundEnabled());
    act(() => a.result.current[1](false));
    expect(b.result.current[0]).toBe(false);
  });
});
