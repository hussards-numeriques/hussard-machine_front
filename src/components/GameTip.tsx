import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/useAuth';
import { useSubscriptionStatus } from '../hooks/useSubscription';
import { pickGameTipKey, resolveTipAudience } from '../lib/gameTips';

export const GameTip: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const isSubscriber = useSubscriptionStatus().data?.active === true;
  const [seed] = React.useState(Math.random);
  const tipKey = pickGameTipKey(resolveTipAudience(isAuthenticated, isSubscriber), seed);

  return <p className="border-t border-slate-100 pt-4 text-sm text-slate-400">💡 {t(tipKey)}</p>;
};
