import { useCallback } from 'react';
import type { SoundId } from '../lib/sounds';
import { soundPlayer } from '../services/sound';
import { useSoundEnabled } from './useSoundEnabled';

export const useSound = (): ((id: SoundId) => void) => {
  const [enabled] = useSoundEnabled();
  return useCallback(
    (id: SoundId) => {
      if (enabled) soundPlayer.play(id);
    },
    [enabled]
  );
};
