import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/useAuth';
import { useIconCatalog, useMyIcons, useSelectIcon } from '../hooks/useIcons';
import { IconCard } from '../components/icons/IconCard';

const IconsNotice: React.FC<{ message: string }> = ({ message }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
        <h1 className="text-3xl font-black text-primary-dark">{t('header.icons')}</h1>
        <p className="text-slate-600">{message}</p>
        <Link to="/" className="inline-block text-primary font-bold hover:underline">
          {t('common.backHome')}
        </Link>
      </div>
    </div>
  );
};

export const IconsPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const catalogQuery = useIconCatalog();
  const myIconsQuery = useMyIcons();
  const selectIcon = useSelectIcon();

  if (authLoading || (isAuthenticated && (catalogQuery.isLoading || myIconsQuery.isLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-lg font-bold animate-pulse">{t('common.loading')}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <IconsNotice message={t('iconsPage.loginRequired')} />;
  }

  if (!catalogQuery.data || !myIconsQuery.data) {
    return <IconsNotice message={t('iconsPage.loadFailed')} />;
  }

  const { icons, selected_icon_id } = myIconsQuery.data;

  return (
    <div className="min-h-screen p-4 pt-20 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-black text-primary-dark">{t('header.icons')}</h1>

      {icons.length === 0 && (
        <p className="text-slate-500 text-sm bg-white rounded-2xl border-2 border-slate-100 p-4">
          {t('iconsPage.none')}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {catalogQuery.data.map((icon) => {
          const owned = icons.find((i) => i.id === icon.id);

          return (
            <IconCard
              key={icon.id}
              icon={icon}
              unlocked={owned != null}
              selected={owned != null && icon.id === selected_icon_id}
              onEquip={(iconId) => selectIcon.mutate(iconId)}
              isPending={selectIcon.isPending}
            />
          );
        })}
      </div>

      <div className="text-center pb-8">
        <Link
          to="/profile"
          className="block text-sm font-bold text-slate-500 hover:text-primary transition-colors"
        >
          {t('profile.backToProfile')}
        </Link>
      </div>
    </div>
  );
};
