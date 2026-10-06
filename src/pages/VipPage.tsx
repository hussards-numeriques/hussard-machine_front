import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useRedeem } from '../hooks/useSubscription';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { ApiError } from '../services/http';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

const VipNotice: React.FC<{ message: string }> = ({ message }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
        <h1 className="text-3xl font-black text-primary-dark">{t('vip.title')}</h1>
        <p className="text-slate-600">{message}</p>
        <Link to="/" className="inline-block text-primary font-bold hover:underline">
          {t('common.backHome')}
        </Link>
      </div>
    </div>
  );
};

const formatExpiry = (isoDate: string) =>
  new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(isoDate)
  );

export const VipPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [code, setCode] = useState('');
  const redeem = useRedeem();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-lg font-bold animate-pulse">{t('common.loading')}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <VipNotice message={t('vip.loginRequired')} />;
  }

  if (redeem.isSuccess && redeem.data?.expires_at) {
    return (
      <VipNotice
        message={t('vip.activatedUntil', { date: formatExpiry(redeem.data.expires_at) })}
      />
    );
  }

  const isInvalidCode =
    redeem.isError &&
    redeem.error instanceof ApiError &&
    redeem.error.code === 'INVALID_REDEEM_CODE';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
        <h1 className="text-3xl font-black text-primary-dark">{t('vip.title')}</h1>
        <Input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder={t('vip.codePlaceholder')}
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
          {t('vip.activate')}
        </Button>
        {isInvalidCode && (
          <p className="text-sm font-bold text-rose-600">{t('errors.api.INVALID_REDEEM_CODE')}</p>
        )}
        {redeem.isError && !isInvalidCode && (
          <p className="text-sm font-bold text-rose-600">{t('vip.error')}</p>
        )}
      </div>
    </div>
  );
};
