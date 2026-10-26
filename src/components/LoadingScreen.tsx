import { useTranslation } from 'react-i18next';

export const LoadingScreen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-slate-400 text-lg font-bold animate-pulse">{t('common.loading')}</div>
    </div>
  );
};
