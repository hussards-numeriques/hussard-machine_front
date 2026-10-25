import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { pickLoadingTip } from '../lib/loadingTips';

export const LoadingScreen: React.FC = () => {
  const { t } = useTranslation();
  const [tipId] = useState(pickLoadingTip);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="text-slate-400 text-lg font-bold animate-pulse">{t('common.loading')}</div>
      <p className="text-sm text-slate-400 max-w-xs">{t(`loadingTips.${tipId}`)}</p>
    </div>
  );
};
