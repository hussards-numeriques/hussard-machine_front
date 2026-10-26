import type { SoundPlayer } from './port';

const GESTURE_EVENTS = ['pointerdown', 'keydown', 'touchend'] as const;

export const unlockOnFirstGesture = (player: SoundPlayer): (() => void) => {
  const release = () => GESTURE_EVENTS.forEach((e) => window.removeEventListener(e, handle));
  const handle = () => {
    player.unlock();
    release();
  };
  GESTURE_EVENTS.forEach((e) => window.addEventListener(e, handle));
  return release;
};
