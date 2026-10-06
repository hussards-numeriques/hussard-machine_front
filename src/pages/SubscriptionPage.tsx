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

const PERKS = [
  { title: 'Parties privées', description: 'Invite ta classe ou tes amis avec un code.' },
  { title: 'Quêtes et titres', description: 'Des titres que tout le monde voit en partie.' },
  { title: 'Couronne', description: 'Affichée à côté de ton pseudo dans le menu.' },
];

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
  const [planAwaitingAdult, setPlanAwaitingAdult] = useState<SubscriptionPlanKey | null>(null);

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
      <div className="flex flex-col items-center text-center gap-2">
        <Mascot pose="clindoeil" title="Rushy" className="w-20 h-20" />
        <h1 className="text-3xl font-black text-primary-dark">Calc Rush+</h1>
        <p className="text-slate-600 font-semibold">Crée tes parties, débloque tes titres.</p>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PERKS.map(({ title, description }) => (
          <li key={title} className="bg-white rounded-2xl border-2 border-slate-100 p-4 shadow-sm">
            <p className="font-black text-slate-800">{title}</p>
            <p className="text-sm text-slate-500 leading-snug">{description}</p>
          </li>
        ))}
      </ul>

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
        <p className="text-sm font-bold text-rose-600">
          Impossible de lancer le paiement, réessaie.
        </p>
      )}

      <div className="text-center space-y-2 pb-8">
        <p className="text-xs text-slate-500 leading-relaxed">
          Le jeu reste gratuit et équitable pour tous. Calc Rush est fait par un dev indé : ton
          abonnement finance les nouveautés.
        </p>
        <p className="flex justify-center items-center gap-3 text-sm font-bold text-slate-400">
          <Link to="/terms-of-sale" className="hover:text-primary transition-colors">
            Conditions de vente
          </Link>
          <Link to="/legal-notice" className="hover:text-primary transition-colors">
            Mentions légales
          </Link>
          <Link to="/privacy-policy" className="hover:text-primary transition-colors">
            Confidentialité
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
