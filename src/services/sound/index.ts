import { WebAudioSoundPlayer } from './WebAudioSoundPlayer';
import type { SoundPlayer } from './port';

export const soundPlayer: SoundPlayer = new WebAudioSoundPlayer();
export type { SoundPlayer } from './port';
