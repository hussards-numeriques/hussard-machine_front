import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalePreference } from '../hooks/useLocalePreference';
import { LOCALES, LOCALE_NAMES, isLocalePreference } from '../i18n/locale';

export const LanguagePill: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [preference, setPreference] = useLocalePreference();

  return (
    <div className="pointer-events-auto relative flex items-center gap-1 h-11 px-3 rounded-full bg-white/90 backdrop-blur shadow border border-slate-200 text-sm font-black text-slate-700">
      <span>{i18n.language.slice(0, 2).toUpperCase()}</span>
      <span aria-hidden="true" className="text-xs">
        ▾
      </span>
      <select
        aria-label={t('settings.language.title')}
        value={preference}
        onChange={(event) => {
          if (isLocalePreference(event.target.value)) setPreference(event.target.value);
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        <option value="auto">{t('locale.auto')}</option>
        {LOCALES.map((locale) => (
          <option key={locale} value={locale}>
            {LOCALE_NAMES[locale]}
          </option>
        ))}
      </select>
    </div>
  );
};
