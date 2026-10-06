export const LOCALES = ['fr', 'en', 'es', 'it', 'pt-BR', 'de'] as const;
export type Locale = (typeof LOCALES)[number];
export type LocalePreference = 'auto' | Locale;

export const FALLBACK_LOCALE: Locale = 'en';

export const LOCALE_NAMES: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  it: 'Italiano',
  'pt-BR': 'Português',
  de: 'Deutsch',
};

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value);

export const isLocalePreference = (value: unknown): value is LocalePreference =>
  value === 'auto' || isLocale(value);

const matchLanguageTag = (tag: string): Locale | undefined => {
  const language = tag.toLowerCase().split('-')[0];
  return language === 'pt' ? 'pt-BR' : LOCALES.find((locale) => locale === language);
};

export const resolveLocale = (
  preference: LocalePreference,
  languages: readonly string[]
): Locale => {
  if (preference !== 'auto') return preference;
  return languages.map(matchLanguageTag).find((locale) => locale !== undefined) ?? FALLBACK_LOCALE;
};
