import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { formatEuros } from '../../lib/money';
import { resolvePlanLabel } from '../../lib/labels';
import { formatShortDate } from '../../lib/date';
import {
  computeMonthlyEquivalentCents,
  computeSavingsPercent,
} from '../../lib/subscriptionPricing';
import type {
  SubscriptionPlan,
  SubscriptionPlanKey,
  SubscriptionStatus,
} from '../../services/subscription';
import { Trans, useTranslation } from 'react-i18next';

interface SubscriptionCardProps {
  plans: SubscriptionPlan[];
  status: SubscriptionStatus | undefined;
  onPurchase: (plan: SubscriptionPlanKey) => void;
  isPurchasePending: boolean;
}

const defaultPlanKey = (plans: SubscriptionPlan[]): SubscriptionPlanKey =>
  plans.find((plan) => plan.key === 'THREE_MONTHS')?.key ?? plans[0].key;

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  plans,
  status,
  onPurchase,
  isPurchasePending,
}) => {
  const { t } = useTranslation();
  const [selectedPlanKey, setSelectedPlanKey] = useState<SubscriptionPlanKey>(() =>
    defaultPlanKey(plans)
  );
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const selectedPlan = plans.find((plan) => plan.key === selectedPlanKey) ?? plans[0];
  const baselineMonthlyAmount = plans.find((plan) => plan.key === 'ONE_MONTH')?.amount;
  const selectedMonthlyEquivalent = computeMonthlyEquivalentCents(
    selectedPlan.amount,
    selectedPlan.key
  );

  return (
    <div className="bg-white rounded-3xl shadow-lg border-2 border-primary-light/50 p-8 space-y-6">
      {status?.active && status.expires_at && (
        <p className="text-sm font-bold text-emerald-700 bg-emerald-50 rounded-2xl border-2 border-emerald-100 p-4">
          {t('subscription.activeUntil', { date: formatShortDate(status.expires_at) })}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {plans.map((plan) => {
          const savingsPercent = computeSavingsPercent(
            plan.amount,
            plan.key,
            baselineMonthlyAmount
          );
          const isSelected = plan.key === selectedPlan.key;
          return (
            <button
              key={plan.key}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedPlanKey(plan.key)}
              className={cn(
                'rounded-xl p-3 text-center transition-colors',
                isSelected ? 'bg-primary text-white' : 'bg-slate-50 text-slate-600'
              )}
            >
              <span className="block font-bold">{resolvePlanLabel(plan.key, t)}</span>
              <span className="block text-xs">
                {t('subscription.perMonth', {
                  price: formatEuros(
                    computeMonthlyEquivalentCents(plan.amount, plan.key),
                    plan.currency
                  ),
                })}
              </span>
              {savingsPercent !== null && savingsPercent > 0 && (
                <span className="block text-xs font-bold text-emerald-500">-{savingsPercent}%</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="text-center space-y-1">
        <p className="text-4xl font-black text-primary-dark">
          {formatEuros(selectedPlan.amount, selectedPlan.currency)}
        </p>
        <p className="text-slate-500 text-sm">
          {t('subscription.equivalentPerMonth', {
            price: formatEuros(selectedMonthlyEquivalent, selectedPlan.currency),
          })}
        </p>
      </div>

      <p className="text-xs font-bold text-slate-500 bg-slate-50 rounded-2xl p-3">
        {t('subscription.oneTime')}
      </p>

      <label className="flex items-start gap-2 text-xs text-slate-500 leading-relaxed">
        <input
          type="checkbox"
          checked={hasAcceptedTerms}
          onChange={(event) => setHasAcceptedTerms(event.target.checked)}
          className="mt-0.5"
        />
        <span>
          <Trans
            i18nKey="subscription.acceptTerms"
            components={{
              terms: (
                <Link to="/terms-of-sale" className="font-bold text-primary hover:underline" />
              ),
            }}
          />
        </span>
      </label>

      <button
        type="button"
        onClick={() => onPurchase(selectedPlan.key)}
        disabled={isPurchasePending || !hasAcceptedTerms}
        className="w-full text-sm font-bold text-white bg-primary px-6 py-3 rounded-full disabled:opacity-50"
      >
        {t(status?.active ? 'subscription.extend' : 'subscription.purchase', {
          plan: resolvePlanLabel(selectedPlan.key, t),
        })}
      </button>
    </div>
  );
};
