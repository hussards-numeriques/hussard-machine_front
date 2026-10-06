import { useSyncExternalStore } from 'react';
import { applyLocale, LOCALE_STORAGE_KEY, readLocalePreference } from '../i18n';
import type { LocalePreference } from '../i18n/locale';

const listeners = new Set<() => void>();

const subscribe = (listener: () => void): (() => void) => {
  const onStorage = (event: StorageEvent): void => {
    if (event.key !== LOCALE_STORAGE_KEY) return;
    applyLocale(readLocalePreference());
    listener();
  };
  listeners.add(listener);
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
};

const persistPreference = (preference: LocalePreference): void => {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, preference);
  } catch {
    return;
  }
};

const setPreference = (preference: LocalePreference): void => {
  persistPreference(preference);
  applyLocale(preference);
  listeners.forEach((listener) => listener());
};

export const useLocalePreference = (): readonly [
  LocalePreference,
  (preference: LocalePreference) => void,
] => {
  const preference = useSyncExternalStore(
    subscribe,
    readLocalePreference,
    (): LocalePreference => 'auto'
  );
  return [preference, setPreference] as const;
};
