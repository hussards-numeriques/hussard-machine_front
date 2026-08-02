import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import {
  useStartCheckout,
  useSubscriptionPlans,
  useSubscriptionStatus,
} from '../hooks/useSubscription';
import { SubscriptionCard } from '../components/subscription/SubscriptionCard';
import { Mascot } from '../components/Mascot';

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

  if (!plansQuery.data || plansQuery.data.length === 0) {
    return <SubscriptionNotice message="Impossible de charger les formules pour le moment." />;
  }

  return (
    <div className="min-h-screen p-4 pt-20 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Mascot pose="clindoeil" title="Rushy" className="w-20 h-20 hidden sm:block" />
        <div>
          <h1 className="text-3xl font-black text-primary-dark">Soutenir Calc Rush</h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            Calc Rush est un projet indé. Ton soutien aide directement à payer l'infrastructure qui
            fait tourner le jeu.
          </p>
        </div>
      </div>

      <SubscriptionCard
        plans={plansQuery.data}
        status={statusQuery.data}
        onPurchase={startCheckout.mutate}
        isPurchasePending={startCheckout.isPending}
      />

      {startCheckout.isError && (
        <p className="text-sm font-bold text-rose-600">
          Impossible de lancer le paiement, réessaie.
        </p>
      )}

      <div className="text-center space-y-2 pb-8">
        <p>
          <Link
            to="/terms-of-sale"
            className="text-sm font-bold text-slate-400 hover:text-primary transition-colors"
          >
            Conditions de vente
          </Link>
        </p>
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
