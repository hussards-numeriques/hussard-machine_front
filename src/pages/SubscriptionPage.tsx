import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import {
  useStartCheckout,
  useSubscriptionPlans,
  useSubscriptionStatus,
} from '../hooks/useSubscription';
import { formatEuros } from '../lib/money';
import { formatShortDate } from '../lib/date';

const SubscriptionNotice: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
      <h1 className="text-3xl font-black text-primary-dark">Abonnement</h1>
      <p className="text-slate-600">{message}</p>
      <Link to="/" className="inline-block text-primary font-bold hover:underline">
        Retour à l'accueil
      </Link>
    </div>
  </div>
);

export const SubscriptionPage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const plansQuery = useSubscriptionPlans();
  const statusQuery = useSubscriptionStatus();
  const startCheckout = useStartCheckout();

  if (authLoading || (isAuthenticated && statusQuery.isLoading) || plansQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-lg font-bold animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SubscriptionNotice message="Connecte-toi pour gérer ton abonnement." />;
  }

  if (!plansQuery.data) {
    return <SubscriptionNotice message="Impossible de charger les formules pour le moment." />;
  }

  const status = statusQuery.data;

  return (
    <div className="min-h-screen p-4 pt-20 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-black text-primary-dark">Abonnement</h1>

      {status?.active && status.expires_at && (
        <p className="text-sm font-bold text-emerald-700 bg-emerald-50 rounded-2xl border-2 border-emerald-100 p-4">
          Actif jusqu'au {formatShortDate(status.expires_at)}.
        </p>
      )}

      <div className="space-y-4">
        {plansQuery.data.map((plan) => (
          <div
            key={plan.key}
            className="flex items-center justify-between bg-white rounded-2xl border-2 border-slate-100 p-4"
          >
            <div>
              <p className="font-bold text-slate-800">{plan.label}</p>
              <p className="text-slate-500 text-sm">{formatEuros(plan.amount, plan.currency)}</p>
            </div>
            <button
              type="button"
              onClick={() => startCheckout.mutate(plan.key)}
              disabled={startCheckout.isPending}
              className="text-sm font-bold text-white bg-primary px-4 py-2 rounded-full disabled:opacity-50"
            >
              Acheter
            </button>
          </div>
        ))}
      </div>

      {startCheckout.isError && (
        <p className="text-sm font-bold text-rose-600">
          Impossible de lancer le paiement, réessaie.
        </p>
      )}

      <div className="text-center pb-8">
        <Link
          to="/profile"
          className="text-sm font-bold text-slate-400 hover:text-primary transition-colors"
        >
          ← Retour au profil
        </Link>
      </div>
    </div>
  );
};
