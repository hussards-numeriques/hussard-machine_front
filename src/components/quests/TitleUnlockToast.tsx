import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { resolveRarityBadgeStyle, resolveRarityLabel } from '../../lib/titles';
import type { MyTitle } from '../../services/quests';

interface TitleUnlockToastProps {
  titles: MyTitle[];
}

const AUTO_DISMISS_MS = 6000;

const Toast: React.FC<{ title: MyTitle; onDismiss: () => void }> = ({ title, onDismiss }) => {
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timeout);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-3 rounded-2xl border-2 shadow-lg font-bold animate-pop-in',
        resolveRarityBadgeStyle(title.rarity)
      )}
    >
      <span>🏆</span>
      <span>
        Titre débloqué : {title.label} ({resolveRarityLabel(title.rarity)})
      </span>
    </div>
  );
};

export const TitleUnlockToast: React.FC<TitleUnlockToastProps> = ({ titles }) => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = titles.filter((t) => !dismissed.has(t.id));

  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      {visible.map((title) => (
        <Toast
          key={title.id}
          title={title}
          onDismiss={() => setDismissed((prev) => new Set(prev).add(title.id))}
        />
      ))}
    </div>
  );
};
