import { useSyncExternalStore } from 'react';

export const SOUND_ENABLED_STORAGE_KEY = 'calc-rush:sound-enabled';

const listeners = new Set<() => void>();

const readEnabled = (): boolean => localStorage.getItem(SOUND_ENABLED_STORAGE_KEY) !== 'false';

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
};

const setEnabled = (enabled: boolean): void => {
  localStorage.setItem(SOUND_ENABLED_STORAGE_KEY, String(enabled));
  listeners.forEach((listener) => listener());
};

export const useSoundEnabled = (): readonly [boolean, (enabled: boolean) => void] => {
  const enabled = useSyncExternalStore(subscribe, readEnabled, () => true);
  return [enabled, setEnabled] as const;
};
