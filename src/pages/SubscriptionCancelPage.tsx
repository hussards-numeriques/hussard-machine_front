import React from 'react';
import { Link } from 'react-router-dom';

export const SubscriptionCancelPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
      <h1 className="text-3xl font-black text-primary-dark">Abonnement</h1>
      <p className="text-slate-600">Paiement annulé, rien n'a été débité.</p>
      <Link to="/subscription" className="inline-block text-primary font-bold hover:underline">
        Retour à l'abonnement
      </Link>
    </div>
  </div>
);
