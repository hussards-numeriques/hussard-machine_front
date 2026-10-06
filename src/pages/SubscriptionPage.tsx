import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import {
  useStartCheckout,
  useSubscriptionPlans,
  useSubscriptionStatus,
} from '../hooks/useSubscription';
import { SubscriptionCard } from '../components/subscription/SubscriptionCard';
import { ParentalGate } from '../components/subscription/ParentalGate';
import type { SubscriptionPlanKey } from '../services/subscription';
import { Mascot } from '../components/Mascot';
import { useTranslation } from 'react-i18next';

const PERKS = ['private', 'quests', 'crown'] as const;

const SubscriptionNotice: React.FC<{ message: string }> = ({ message }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
        <h1 className="text-3xl font-black text-primary-dark">{t('subscription.title')}</h1>
        <p className="text-slate-600">{message}</p>
        <Link to="/" className="inline-block text-primary font-bold hover:underline">
          {t('common.backHome')}
        </Link>
      </div>
    </div>
  );
};

export const SubscriptionPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const plansQuery = useSubscriptionPlans();
  const statusQuery = useSubscriptionStatus();
  const startCheckout = useStartCheckout();
  const [planAwaitingAdult, setPlanAwaitingAdult] = useState<SubscriptionPlanKey | null>(null);

  if (authLoading || (isAuthenticated && statusQuery.isLoading) || plansQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-lg font-bold animate-pulse">{t('common.loading')}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SubscriptionNotice message={t('subscription.loginRequired')} />;
  }

  if (!plansQuery.data || plansQuery.data.length === 0) {
    return <SubscriptionNotice message={t('subscription.plansUnavailable')} />;
  }

  return (
    <div className="min-h-screen p-4 pt-20 max-w-2xl mx-auto space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-primary to-violet-500 p-8 text-white shadow-xl space-y-6">
        <div className="flex flex-col items-center text-center gap-2">
          <Mascot pose="clindoeil" title="Rushy" className="w-20 h-20 drop-shadow" />
          <h1 className="text-4xl font-black">Calc Rush+</h1>
          <p className="font-semibold text-white/90">{t('subscriptionStatus.upsellText')}</p>
        </div>
        <ul className="space-y-4">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-primary"
              >
                ✓
              </span>
              <span>
                <span className="block text-lg font-black">
                  {t(`subscription.perks.${perk}.title`)}
                </span>
                <span className="block text-sm text-white/80">
                  {t(`subscription.perks.${perk}.text`)}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="text-center text-sm font-semibold text-white/80">
          {t('subscription.fairPlay')}
        </p>
      </section>

      <SubscriptionCard
        plans={plansQuery.data}
        status={statusQuery.data}
        onPurchase={setPlanAwaitingAdult}
        isPurchasePending={startCheckout.isPending}
      />

      {planAwaitingAdult && (
        <ParentalGate
          onPass={() => {
            startCheckout.mutate(planAwaitingAdult);
            setPlanAwaitingAdult(null);
          }}
          onCancel={() => setPlanAwaitingAdult(null)}
        />
      )}

      {startCheckout.isError && (
        <p className="text-sm font-bold text-rose-600">{t('subscription.checkoutFailed')}</p>
      )}

      <div className="text-center space-y-2 pb-8">
        <p className="flex justify-center items-center gap-3 text-sm font-bold text-slate-400">
          <Link to="/terms-of-sale" className="hover:text-primary transition-colors">
            {t('subscription.termsOfSale')}
          </Link>
          <Link to="/legal-notice" className="hover:text-primary transition-colors">
            {t('footer.legalNotice')}
          </Link>
          <Link to="/privacy-policy" className="hover:text-primary transition-colors">
            {t('footer.privacy')}
          </Link>
        </p>
        <Link
          to="/profile"
          className="text-sm font-bold text-slate-400 hover:text-primary transition-colors"
        >
          {t('profile.backToProfile')}
        </Link>
      </div>
    </div>
  );
};
