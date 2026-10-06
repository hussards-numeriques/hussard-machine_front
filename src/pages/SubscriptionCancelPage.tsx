import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const SubscriptionCancelPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
        <h1 className="text-3xl font-black text-primary-dark">{t('subscription.title')}</h1>
        <p className="text-slate-600">{t('subscription.cancelled')}</p>
        <Link to="/subscription" className="inline-block text-primary font-bold hover:underline">
          {t('subscription.backToSubscription')}
        </Link>
      </div>
    </div>
  );
};
