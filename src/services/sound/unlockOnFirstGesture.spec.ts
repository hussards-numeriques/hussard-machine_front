import { describe, it, expect, vi } from 'vitest';
import { unlockOnFirstGesture } from './unlockOnFirstGesture';
import type { SoundPlayer } from './port';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('unlockOnFirstGesture', () => {
  it('keeps listening until the context is actually unlocked', async () => {
    const unlock = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true);
    const player: SoundPlayer = { play: vi.fn(), unlock };
    const release = unlockOnFirstGesture(player);
    window.dispatchEvent(new Event('pointerup'));
    await flush();
    window.dispatchEvent(new Event('touchend'));
    await flush();
    window.dispatchEvent(new Event('click'));
    await flush();
    expect(unlock).toHaveBeenCalledTimes(2);
    release();
  });
});
