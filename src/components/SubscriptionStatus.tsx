import React, { useId } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSubscriptionStatus } from '../hooks/useSubscription';
import { daysUntil, formatLongDate } from '../lib/date';
import { cn } from '../lib/utils';

const EXPIRY_WARNING_DAYS = 7;

export const SupporterCrown: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className,
}) => {
  const gradientId = `supporter-crown-${useId()}`;
  return (
    <svg
      data-testid="supporter-crown"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.55" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <path
        d="M3 8.5l4.5 3.5L12 4.5l4.5 7.5L21 8.5l-2 10.5H5z"
        fill={`url(#${gradientId})`}
        stroke="#92400e"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="14.5" r="1.8" fill="#e11d48" stroke="#fff" strokeWidth="0.8" />
      <circle cx="3" cy="8.5" r="1.4" fill="#fde68a" stroke="#92400e" strokeWidth="0.8" />
      <circle cx="12" cy="4.5" r="1.4" fill="#fde68a" stroke="#92400e" strokeWidth="0.8" />
      <circle cx="21" cy="8.5" r="1.4" fill="#fde68a" stroke="#92400e" strokeWidth="0.8" />
    </svg>
  );
};

export const SubscriptionMenuCard: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { data } = useSubscriptionStatus();

  if (!data) {
    return null;
  }

  if (!data.active || !data.expires_at) {
    return (
      <Link
        to="/subscription"
        onClick={onNavigate}
        className="flex items-center gap-3 m-2 p-3 rounded-xl bg-gradient-to-br from-primary to-violet-500 text-white shadow hover:brightness-110 transition"
      >
        <SupporterCrown size={28} className="shrink-0 drop-shadow" />
        <span className="text-xs font-semibold leading-snug">
          <span className="block text-sm font-black">{t('subscriptionStatus.upsellTitle')}</span>
          {t('subscriptionStatus.upsellText')}
        </span>
      </Link>
    );
  }

  const daysLeft = daysUntil(data.expires_at);
  const expiresSoon = daysLeft <= EXPIRY_WARNING_DAYS;

  return (
    <Link
      to="/subscription"
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 m-2 p-3 rounded-xl border-2 transition',
        expiresSoon
          ? 'bg-rose-50 border-rose-200 hover:border-rose-300'
          : 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200 hover:border-amber-300'
      )}
    >
      <SupporterCrown size={28} className="shrink-0" />
      <span className="text-xs font-semibold leading-snug text-amber-900">
        <span className="block text-sm font-black text-amber-700">Calc Rush+</span>
        {expiresSoon ? (
          <span className="text-rose-700">
            {t('subscriptionStatus.expiresIn', { count: Math.max(daysLeft, 1) })} ·{' '}
            <span className="font-black underline">{t('subscriptionStatus.extend')}</span>
          </span>
        ) : (
          <>{t('subscriptionStatus.until', { date: formatLongDate(data.expires_at) })}</>
        )}
      </span>
    </Link>
  );
};
