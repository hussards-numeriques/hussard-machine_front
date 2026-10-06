import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import posthog from 'posthog-js';
import { useAuth } from '../contexts/useAuth';
import { useSubscriptionStatus } from '../hooks/useSubscription';
import { useTranslation } from 'react-i18next';

export const POLL_INTERVAL_MS = 1500;
export const MAX_POLL_ATTEMPTS = 6;

export const SubscriptionSuccessPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const statusQuery = useSubscriptionStatus();
  const [pollAttempts, setPollAttempts] = useState(0);

  const status = statusQuery.data;
  const confirmed = status?.active === true;
  const { refetch, isLoading: statusLoading } = statusQuery;

  useEffect(() => {
    if (confirmed) {
      posthog.capture('subscription_completed');
    }
  }, [confirmed]);

  useEffect(() => {
    if (
      authLoading ||
      !isAuthenticated ||
      statusLoading ||
      confirmed ||
      pollAttempts >= MAX_POLL_ATTEMPTS
    ) {
      return;
    }
    const timeout = window.setTimeout(() => {
      void refetch();
      setPollAttempts((count) => count + 1);
    }, POLL_INTERVAL_MS);
    return () => window.clearTimeout(timeout);
  }, [authLoading, isAuthenticated, statusLoading, refetch, confirmed, pollAttempts]);

  if (authLoading || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-lg font-bold animate-pulse">{t('common.loading')}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
          <h1 className="text-3xl font-black text-primary-dark">{t('subscription.title')}</h1>
          <p className="text-slate-600">{t('subscription.statusLoginRequired')}</p>
          <Link to="/" className="inline-block text-primary font-bold hover:underline">
            {t('common.backHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
        <h1 className="text-3xl font-black text-primary-dark">{t('subscription.title')}</h1>
        {confirmed ? (
          <>
            <p className="text-slate-600">{t('subscription.confirmed')}</p>
            <Link to="/profile" className="inline-block text-primary font-bold hover:underline">
              {t('subscription.backToProfile')}
            </Link>
          </>
        ) : pollAttempts < MAX_POLL_ATTEMPTS ? (
          <p className="text-slate-600 animate-pulse">{t('subscription.confirming')}</p>
        ) : (
          <>
            <p className="text-slate-600">{t('subscription.slow')}</p>
            <Link
              to="/subscription"
              className="inline-block text-primary font-bold hover:underline"
            >
              {t('subscription.backToSubscription')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
