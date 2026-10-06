import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { isLocalePreference, resolveLocale, type LocalePreference } from './locale';
import { fr } from './locales/fr';
import { en } from './locales/en';
import { es } from './locales/es';
import { it } from './locales/it';
import { ptBR } from './locales/pt-BR';
import { de } from './locales/de';

export const LOCALE_STORAGE_KEY = 'calc-rush:locale';

export const readLocalePreference = (): LocalePreference => {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocalePreference(stored) ? stored : 'auto';
  } catch {
    return 'auto';
  }
};

export const applyLocale = (preference: LocalePreference): void => {
  const locale = resolveLocale(preference, navigator.languages);
  void i18n.changeLanguage(locale);
  document.documentElement.lang = locale;
};

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    es: { translation: es },
    it: { translation: it },
    'pt-BR': { translation: ptBR },
    de: { translation: de },
  },
  lng: resolveLocale(readLocalePreference(), navigator.languages),
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
  initAsync: false,
});

document.documentElement.lang = i18n.language;

export default i18n;
