import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useTranslation } from 'react-i18next';
import { parseOAuthFragment } from '../services/AuthClient';

export const OAuthCallbackPage: React.FC = () => {
  const { t } = useTranslation();
  const { client, reloadUser } = useAuth();
  const navigate = useNavigate();
  const [{ tokens, error }] = useState(() => parseOAuthFragment(window.location.hash));

  useEffect(() => {
    if (!tokens) {
      return;
    }

    const finalize = async () => {
      client.setTokens(tokens);
      await reloadUser();
      navigate('/', { replace: true });
    };

    void finalize();
  }, [tokens, client, reloadUser, navigate]);

  const message = error ?? (tokens ? null : t('oauth.failed'));

  if (message) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <div className="p-4 bg-rose-100 text-rose-700 rounded-xl text-center font-bold">
          {t('oauth.failedWithReason', { message })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <p className="text-slate-600 font-bold">{t('oauth.inProgress')}</p>
    </div>
  );
};
