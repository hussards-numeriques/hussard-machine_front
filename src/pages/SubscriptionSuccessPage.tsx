import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useSubscriptionStatus } from '../hooks/useSubscription';

export const POLL_INTERVAL_MS = 1500;
export const MAX_POLL_ATTEMPTS = 6;

export const SubscriptionSuccessPage: React.FC = () => {
  const { isLoading: authLoading } = useAuth();
  const statusQuery = useSubscriptionStatus();
  const [pollAttempts, setPollAttempts] = useState(0);

  const status = statusQuery.data;
  const confirmed = status?.active === true;
  const { refetch, isLoading: statusLoading } = statusQuery;

  useEffect(() => {
    if (authLoading || statusLoading || confirmed || pollAttempts >= MAX_POLL_ATTEMPTS) {
      return;
    }
    const timeout = window.setTimeout(() => {
      void refetch();
      setPollAttempts((count) => count + 1);
    }, POLL_INTERVAL_MS);
    return () => window.clearTimeout(timeout);
  }, [authLoading, statusLoading, refetch, confirmed, pollAttempts]);

  if (authLoading || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-lg font-bold animate-pulse">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
        <h1 className="text-3xl font-black text-primary-dark">Abonnement</h1>
        {confirmed ? (
          <>
            <p className="text-slate-600">Paiement confirmé, ton abonnement est actif !</p>
            <Link to="/profile" className="inline-block text-primary font-bold hover:underline">
              Retour au profil
            </Link>
          </>
        ) : pollAttempts < MAX_POLL_ATTEMPTS ? (
          <p className="text-slate-600 animate-pulse">Confirmation en cours...</p>
        ) : (
          <>
            <p className="text-slate-600">
              La confirmation prend plus de temps que prévu, réessaie de rafraîchir dans un instant.
            </p>
            <Link
              to="/subscription"
              className="inline-block text-primary font-bold hover:underline"
            >
              Retour à l'abonnement
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
