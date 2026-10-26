import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalePreference } from '../hooks/useLocalePreference';
import { LOCALES, LOCALE_NAMES, isLocalePreference } from '../i18n/locale';

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const [preference, setPreference] = useLocalePreference();

  return (
    <footer className="py-6 text-center text-xs text-slate-400">
      <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1">
        <a
          href="https://www.alextraveylan.fr/fr/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors"
        >
          {t('footer.contact')}
        </a>
        <Link to="/terms-of-sale" className="hover:text-primary transition-colors">
          {t('footer.termsOfSale')}
        </Link>
        <Link to="/terms" className="hover:text-primary transition-colors">
          {t('footer.terms')}
        </Link>
        <Link to="/legal-notice" className="hover:text-primary transition-colors">
          {t('footer.legalNotice')}
        </Link>
        <Link to="/privacy-policy" className="hover:text-primary transition-colors">
          {t('footer.privacy')}
        </Link>
      </div>
      <label className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 hover:border-primary transition-colors">
        <span aria-hidden="true">🌐</span>
        <span>{t('settings.language.title')}</span>
        <select
          aria-label={t('settings.language.title')}
          value={preference}
          onChange={(event) => {
            if (isLocalePreference(event.target.value)) setPreference(event.target.value);
          }}
          className="bg-transparent text-xs font-semibold text-slate-600 cursor-pointer focus:outline-none"
        >
          <option value="auto">{t('locale.auto')}</option>
          {LOCALES.map((locale) => (
            <option key={locale} value={locale}>
              {LOCALE_NAMES[locale]}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-3">{t('footer.rights', { year })}</div>
    </footer>
  );
};
