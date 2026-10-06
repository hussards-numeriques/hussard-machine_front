import type { TFunction } from 'i18next';
import React from 'react';
import { cn } from '../../lib/utils';
import { resolveLevelLabel } from '../../lib/grades';
import type { TitlesLevelView } from '../../lib/titlesLevelView';
import { useTranslation } from 'react-i18next';

interface TitlesLevelBannerProps {
  view: TitlesLevelView;
}

interface TitlesLevelCopy {
  heading: string;
  body: string;
}

const resolveCopy = (view: TitlesLevelView, t: TFunction): TitlesLevelCopy => {
  switch (view.kind) {
    case 'active': {
      const levelLabel = resolveLevelLabel(view.level, t, 'long');
      return {
        heading: t('quests.banner.activeHeading', { level: levelLabel }),
        body: t('quests.banner.activeBody', { level: levelLabel }),
      };
    }
    case 'inactive-memories': {
      return {
        heading: t('quests.banner.inactiveHeading', {
          level: resolveLevelLabel(view.level, t, 'long'),
        }),
        body: t('quests.banner.memoriesBody', {
          currentLevel: resolveLevelLabel(view.currentLevel, t, 'long'),
        }),
      };
    }
    case 'inactive-empty': {
      return {
        heading: t('quests.banner.inactiveHeading', {
          level: resolveLevelLabel(view.level, t, 'long'),
        }),
        body: t('quests.banner.emptyBody', {
          currentLevel: resolveLevelLabel(view.currentLevel, t, 'long'),
        }),
      };
    }
  }
};

export const TitlesLevelBanner: React.FC<TitlesLevelBannerProps> = ({ view }) => {
  const { t } = useTranslation();
  const { heading, body } = resolveCopy(view, t);
  const isActive = view.kind === 'active';

  return (
    <div
      role="status"
      className={cn(
        'rounded-2xl p-4 text-sm space-y-1 border-2',
        isActive
          ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
          : 'bg-slate-50 border-slate-200 text-slate-600'
      )}
    >
      <p className="font-bold">{heading}</p>
      <p>{body}</p>
    </div>
  );
};
