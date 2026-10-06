import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import i18n from './i18n';

window.matchMedia ??= vi.fn().mockReturnValue({ matches: false });

void i18n.changeLanguage('fr');

afterEach(() => {
  void i18n.changeLanguage('fr');
});
