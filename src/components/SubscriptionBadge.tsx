import React from 'react';
import { useAuth } from '../contexts/useAuth';
import { useSubscriptionStatus } from '../hooks/useSubscription';
import { formatShortDate } from '../lib/date';

export const SubscriptionBadge: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { data } = useSubscriptionStatus();

  if (!isAuthenticated || !data?.active || !data.expires_at) {
    return null;
  }

  return (
    <div className="text-xs font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-full shadow border border-slate-200">
      Actif jusqu'au {formatShortDate(data.expires_at)}
    </div>
  );
};
