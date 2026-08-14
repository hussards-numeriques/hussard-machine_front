import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface PromotionAvailableToastProps {
  visible: boolean;
}

const AUTO_DISMISS_MS = 6000;

export const PromotionAvailableToast: React.FC<PromotionAvailableToastProps> = ({ visible }) => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(false);
      return;
    }
    const timeout = window.setTimeout(() => setDismissed(true), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timeout);
  }, [visible]);

  if (!visible || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 shadow-lg font-bold animate-pop-in bg-emerald-50 text-emerald-700 border-emerald-300">
        <span>✨</span>
        <span>Tu peux monter de niveau !</span>
        <Link to="/profile" className="underline hover:no-underline">
          Voir mon profil →
        </Link>
      </div>
    </div>
  );
};
