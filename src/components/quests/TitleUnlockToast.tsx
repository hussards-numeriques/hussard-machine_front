import React, { useCallback, useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { resolveRarityBadgeStyle, resolveRarityLabel } from '../../lib/titles';
import type { MyTitle } from '../../services/quests';

interface TitleUnlockToastProps {
  titles: MyTitle[];
}

const AUTO_DISMISS_MS = 6000;

const Toast: React.FC<{ title: MyTitle; onDismiss: (id: string) => void }> = ({
  title,
  onDismiss,
}) => {
  useEffect(() => {
    const timeout = window.setTimeout(() => onDismiss(title.id), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timeout);
  }, [title.id, onDismiss]);

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

  const handleDismiss = useCallback((id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  }, []);

  const visible = titles.filter((t) => !dismissed.has(t.id));

  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      {visible.map((title) => (
        <Toast key={title.id} title={title} onDismiss={handleDismiss} />
      ))}
    </div>
  );
};
