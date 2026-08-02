import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { formatEuros } from '../../lib/money';
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
  const [selectedPlanKey, setSelectedPlanKey] = useState<SubscriptionPlanKey>(() =>
    defaultPlanKey(plans)
  );
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
          Actif jusqu'au {formatShortDate(status.expires_at)}.
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
              <span className="block font-bold">{plan.label}</span>
              <span className="block text-xs">
                {`${formatEuros(computeMonthlyEquivalentCents(plan.amount, plan.key), plan.currency)}/mois`}
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
          {`soit ${formatEuros(selectedMonthlyEquivalent, selectedPlan.currency)}/mois`}
        </p>
      </div>

      <ul className="text-slate-600 text-sm leading-relaxed space-y-2 list-none">
        <li>Ta progression vers les prochains titres continue.</li>
        <li>Un badge de soutien visible dans le header.</li>
        <li>Un coup de main direct pour payer l'infra du jeu.</li>
      </ul>
      <p className="text-slate-500 text-xs leading-relaxed">
        Aucun avantage en jeu — XP, niveau, grade et streak restent les mêmes pour tout le monde.
      </p>

      <p className="text-xs font-bold text-slate-500 bg-slate-50 rounded-2xl p-3">
        Paiement unique. Pas de renouvellement automatique — ton soutien dure exactement la durée
        choisie, puis s'arrête tout seul.
      </p>

      <button
        type="button"
        onClick={() => onPurchase(selectedPlan.key)}
        disabled={isPurchasePending}
        className="w-full text-sm font-bold text-white bg-primary px-6 py-3 rounded-full disabled:opacity-50"
      >
        {status?.active ? `Prolonger de ${selectedPlan.label}` : `Soutenir ${selectedPlan.label}`}
      </button>
    </div>
  );
};
