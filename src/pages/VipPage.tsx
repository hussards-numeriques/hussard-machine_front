import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useRedeem } from '../hooks/useSubscription';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { ApiError } from '../services/http';

const VipNotice: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
      <h1 className="text-3xl font-black text-primary-dark">Code VIP</h1>
      <p className="text-slate-600">{message}</p>
      <Link to="/" className="inline-block text-primary font-bold hover:underline">
        Retour à l'accueil
      </Link>
    </div>
  </div>
);

const formatExpiry = (isoDate: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(isoDate)
  );

export const VipPage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [code, setCode] = useState('');
  const redeem = useRedeem();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-lg font-bold animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <VipNotice message="Connecte-toi pour activer ton code." />;
  }

  if (redeem.isSuccess && redeem.data?.expires_at) {
    return (
      <VipNotice
        message={`Abonnement activé jusqu'au ${formatExpiry(redeem.data.expires_at)} 🎉`}
      />
    );
  }

  const isInvalidCode =
    redeem.isError && redeem.error instanceof ApiError && redeem.error.status === 400;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
        <h1 className="text-3xl font-black text-primary-dark">Code VIP</h1>
        <Input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Ton code"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          maxLength={256}
        />
        <Button
          onClick={() => redeem.mutate(code)}
          disabled={redeem.isPending || code.trim().length === 0}
        >
          Activer
        </Button>
        {isInvalidCode && <p className="text-sm font-bold text-rose-600">Code invalide.</p>}
        {redeem.isError && !isInvalidCode && (
          <p className="text-sm font-bold text-rose-600">Une erreur est survenue, réessaie.</p>
        )}
      </div>
    </div>
  );
};
