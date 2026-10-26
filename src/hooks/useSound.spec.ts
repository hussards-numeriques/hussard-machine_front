import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { SOUND_ENABLED_STORAGE_KEY } from './useSoundEnabled';

const play = vi.fn();
vi.mock('../services/sound', () => ({ soundPlayer: { play, unlock: vi.fn() } }));

const { useSound } = await import('./useSound');

describe('useSound', () => {
  beforeEach(() => {
    localStorage.clear();
    play.mockClear();
  });

  it('plays the requested sound when enabled', () => {
    const { result } = renderHook(() => useSound());
    result.current('correct');
    expect(play).toHaveBeenCalledWith('correct');
  });

  it('stays silent when sounds are disabled', () => {
    localStorage.setItem(SOUND_ENABLED_STORAGE_KEY, 'false');
    const { result } = renderHook(() => useSound());
    result.current('correct');
    expect(play).not.toHaveBeenCalled();
  });
});
