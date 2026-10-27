import { useCallback } from 'react';
import type { Sound } from '../lib/sounds';
import { soundPlayer } from '../services/sound';
import { useSoundEnabled } from './useSoundEnabled';

export const useSound = (): ((sound: Sound) => void) => {
  const [enabled] = useSoundEnabled();
  return useCallback(
    (sound: Sound) => {
      if (enabled) soundPlayer.play(sound);
    },
    [enabled]
  );
};
