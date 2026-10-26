import type { SoundId } from '../../lib/sounds';

export interface SoundPlayer {
  play: (id: SoundId) => void;
  unlock: () => void;
}
