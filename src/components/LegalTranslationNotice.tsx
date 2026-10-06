import React from 'react';
import { useTranslation } from 'react-i18next';

export const LegalTranslationNotice: React.FC = () => {
  const { t, i18n } = useTranslation();
  if (i18n.language === 'fr') return null;
  return (
    <p className="text-sm font-bold text-amber-700 bg-amber-50 rounded-2xl p-3">
      {t('legal.translationNotice')}
    </p>
  );
};
