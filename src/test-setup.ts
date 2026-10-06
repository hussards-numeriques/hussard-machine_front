import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import i18n, { LOCALE_STORAGE_KEY } from './i18n';

window.matchMedia ??= vi.fn().mockReturnValue({ matches: false });

void i18n.changeLanguage('fr');

afterEach(() => {
  void i18n.changeLanguage('fr');
  localStorage.removeItem(LOCALE_STORAGE_KEY);
  document.documentElement.lang = 'fr';
});
