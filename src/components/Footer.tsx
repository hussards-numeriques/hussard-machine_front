import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

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
      <div className="mt-2">{t('footer.rights', { year })}</div>
    </footer>
  );
};
