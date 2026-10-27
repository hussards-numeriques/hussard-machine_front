import type { Sound } from '../../lib/sounds';

export interface SoundPlayer {
  play: (sound: Sound) => void;
  unlock: () => Promise<boolean>;
}
