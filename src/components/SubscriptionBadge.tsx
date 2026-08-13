import React, { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useSubscriptionStatus } from '../hooks/useSubscription';
import { formatLongDate } from '../lib/date';

export const SubscriptionBadge: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { data } = useSubscriptionStatus();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const gradientId = `subscription-plus-${useId()}`;

  useEffect(() => {
    if (!open) {
      return;
    }
    const onClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  if (!isAuthenticated || !data?.active || !data.expires_at) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Abonnement actif"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-8 h-8 rounded-full shadow border border-amber-300 transition hover:brightness-110"
      >
        <svg width="100%" height="100%" viewBox="0 0 32 32" aria-hidden="true">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fbbf24" />
              <stop offset="1" stopColor="#d97706" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="16" fill={`url(#${gradientId})`} />
          <path d="M16 10v12M10 16h12" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-60 z-20 bg-white rounded-xl shadow-xl border-2 border-slate-100 p-3 text-left text-xs font-semibold text-slate-600 leading-relaxed space-y-2">
          <p>Abonnement actif jusqu'au {formatLongDate(data.expires_at)}.</p>
          <Link
            to="/subscription"
            onClick={() => setOpen(false)}
            className="block font-bold text-primary hover:underline"
          >
            Prolonger →
          </Link>
        </div>
      )}
    </div>
  );
};
