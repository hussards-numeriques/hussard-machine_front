import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useMyTitles, useQuestCatalog, useSelectTitle } from '../hooks/useQuests';
import { useSubscriptionStatus } from '../hooks/useSubscription';
import { QuestProgressCard } from '../components/quests/QuestProgressCard';
import { TitlesLevelBanner } from '../components/quests/TitlesLevelBanner';
import { LevelSelector } from '../components/quests/LevelSelector';
import { resolveTitlesLevelView } from '../lib/titlesLevelView';
import { cn } from '../lib/utils';
import type { Level } from '../lib/grades';

const QuestsNotice: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
      <h1 className="text-3xl font-black text-primary-dark">Quêtes &amp; Titres</h1>
      <p className="text-slate-600">{message}</p>
      <Link to="/" className="inline-block text-primary font-bold hover:underline">
        Retour à l'accueil
      </Link>
    </div>
  </div>
);

export const QuestsPage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const catalogQuery = useQuestCatalog();
  const [viewedLevel, setViewedLevel] = useState<Level | null>(null);
  const myTitlesQuery = useMyTitles(viewedLevel);
  const selectTitle = useSelectTitle();
  const subscriptionStatus = useSubscriptionStatus();

  if (authLoading || (isAuthenticated && (catalogQuery.isLoading || myTitlesQuery.isLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-lg font-bold animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <QuestsNotice message="Connecte-toi pour voir tes quêtes et tes titres." />;
  }

  if (!catalogQuery.data || !myTitlesQuery.data) {
    return <QuestsNotice message="Impossible de charger tes quêtes pour le moment." />;
  }

  const { titles, quests, selected_title_id, level, current_level } = myTitlesQuery.data;
  const view = resolveTitlesLevelView(myTitlesQuery.data);
  const isActive = view.kind === 'active';

  return (
    <div className="min-h-screen p-4 pt-20 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-black text-primary-dark">Quêtes &amp; Titres</h1>

      <LevelSelector level={level} currentLevel={current_level} onChange={setViewedLevel} />

      <TitlesLevelBanner view={view} />

      {isActive && subscriptionStatus.data?.active === false && (
        <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 text-sm text-amber-800 space-y-2">
          <p>
            Ta progression vers les prochains titres est en pause. Les titres déjà débloqués restent
            à toi.
          </p>
          <Link to="/subscription" className="font-bold underline">
            Voir l'abonnement
          </Link>
        </div>
      )}

      {titles.length === 0 && (
        <p className="text-slate-500 text-sm bg-white rounded-2xl border-2 border-slate-100 p-4">
          {isActive
            ? "Aucun titre débloqué pour l'instant. Progresse dans les quêtes ci-dessous pour en gagner !"
            : 'Aucun titre débloqué à ce niveau.'}
        </p>
      )}

      <div className={cn('space-y-4', myTitlesQuery.isPlaceholderData && 'opacity-50')}>
        {catalogQuery.data.map((quest) => {
          const questProgress = quests.find((q) => q.id === quest.id);
          if (!questProgress) return null;

          return (
            <QuestProgressCard
              key={quest.id}
              quest={quest}
              progress={questProgress}
              selectedTitleId={selected_title_id}
              mode={
                isActive
                  ? {
                      kind: 'editable',
                      onEquip: (titleId) => selectTitle.mutate({ titleId, level }),
                      isPending: selectTitle.isPending,
                    }
                  : { kind: 'readonly' }
              }
            />
          );
        })}
      </div>

      <div className="text-center pb-8">
        <Link
          to="/profile"
          className="block text-sm font-bold text-slate-500 hover:text-primary transition-colors"
        >
          ← Retour au profil
        </Link>
      </div>
    </div>
  );
};
