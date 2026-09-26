import React from 'react';
import { cn } from '../../lib/utils';
import type { MyQuest, Quest } from '../../services/quests';

export type QuestProgressCardMode =
  | { kind: 'editable'; onEquip: (titleId: string | null) => void; isPending: boolean }
  | { kind: 'readonly' };

interface QuestProgressCardProps {
  quest: Quest;
  progress: MyQuest;
  selectedTitleId: string | null;
  mode: QuestProgressCardMode;
}

interface TierActionProps {
  mode: QuestProgressCardMode;
  equipped: boolean;
  titleId: string;
}

const TierAction: React.FC<TierActionProps> = ({ mode, equipped, titleId }) => {
  if (mode.kind === 'readonly') {
    return equipped ? (
      <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border bg-slate-100 text-slate-500 border-slate-300">
        ✓ Était équipé
      </span>
    ) : null;
  }

  return (
    <button
      type="button"
      disabled={mode.isPending}
      onClick={() => mode.onEquip(equipped ? null : titleId)}
      className={cn(
        'shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50',
        equipped
          ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
          : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
      )}
    >
      {equipped ? '✓ Équipé' : 'Équiper'}
    </button>
  );
};

export const QuestProgressCard: React.FC<QuestProgressCardProps> = ({
  quest,
  progress,
  selectedTitleId,
  mode,
}) => {
  return (
    <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-700">{quest.label}</h3>
        <span className="text-xs font-bold text-slate-400">{progress.progress}</span>
      </div>
      <div className="space-y-2">
        {quest.tiers.map((tier) => {
          const tierProgress = progress.tiers.find((t) => t.threshold === tier.threshold);
          const unlocked = tierProgress?.unlocked ?? false;
          const equipped = unlocked && tier.title.id === selectedTitleId;

          return (
            <div
              key={tier.threshold}
              className={cn(
                'flex items-center justify-between gap-2 px-3 py-2 rounded-xl',
                unlocked ? 'bg-white border border-slate-200' : 'bg-slate-100'
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={unlocked ? 'text-primary' : 'text-slate-300'}>
                  {unlocked ? '●' : '○'}
                </span>
                <span
                  className={cn(
                    'text-sm font-bold truncate',
                    unlocked ? 'text-slate-700' : 'text-slate-400'
                  )}
                >
                  {tier.title.label} ({tier.threshold})
                </span>
              </div>
              {unlocked && <TierAction mode={mode} equipped={equipped} titleId={tier.title.id} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};
