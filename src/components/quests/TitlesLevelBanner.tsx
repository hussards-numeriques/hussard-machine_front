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
        heading: `Titres actifs — niveau ${levelLabel}.`,
        body: `C'est ton niveau actuel : tes parties en ${levelLabel} font avancer ces quêtes, et le titre que tu équipes ici s'affiche en jeu.`,
      };
    }
    case 'inactive-memories': {
      return {
        heading: `Niveau ${resolveLevelLabel(view.level, t, 'long')} — titres inactifs.`,
        body: `Ce n'est plus ton niveau : ces titres ne s'affichent plus en jeu et ne peuvent pas être équipés. Ils sont là pour la nostalgie du passé ! Tes titres actifs sont ceux du niveau ${resolveLevelLabel(view.currentLevel, t, 'long')}.`,
      };
    }
    case 'inactive-empty': {
      return {
        heading: `Niveau ${resolveLevelLabel(view.level, t, 'long')} — titres inactifs.`,
        body: `Aucun souvenir ici pour l'instant. Seuls les titres de ton niveau actuel (${resolveLevelLabel(view.currentLevel, t, 'long')}) sont actifs.`,
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
