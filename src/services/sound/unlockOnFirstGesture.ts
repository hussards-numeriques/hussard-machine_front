import type { SoundPlayer } from './port';

const GESTURE_EVENTS = ['pointerup', 'click', 'touchend', 'keydown'] as const;

export const unlockOnFirstGesture = (player: SoundPlayer): (() => void) => {
  const release = () => GESTURE_EVENTS.forEach((e) => window.removeEventListener(e, handle));
  const handle = () => {
    void player.unlock().then((unlocked) => {
      if (unlocked) release();
    });
  };
  GESTURE_EVENTS.forEach((e) => window.addEventListener(e, handle));
  return release;
};
