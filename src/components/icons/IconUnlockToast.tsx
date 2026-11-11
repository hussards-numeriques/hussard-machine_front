import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { resolveIconLabel } from '../../lib/labels';
import { resolveRarityLabel } from '../../lib/rarity';
import { useSound } from '../../hooks/useSound';
import type { PlayerIcon } from '../../services/icons';

interface IconUnlockToastProps {
  icons: PlayerIcon[];
}

const AUTO_DISMISS_MS = 10000;

const Toast: React.FC<{ icon: PlayerIcon; onDismiss: (id: string) => void }> = ({
  icon,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const play = useSound();
  const label = resolveIconLabel(icon.id, t);
  useEffect(() => {
    play('unlock');
  }, [play]);
  useEffect(() => {
    const timeout = window.setTimeout(() => onDismiss(icon.id), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timeout);
  }, [icon.id, onDismiss]);

  return (
    <div className="flex flex-col items-center gap-2 px-5 py-3 rounded-2xl border-2 border-slate-100 bg-white shadow-xl animate-pop-in">
      <span className="text-sm font-bold text-slate-600">
        {t('icons.unlocked', { rarity: resolveRarityLabel(icon.rarity, t) })}
      </span>
      <img src={icon.url} alt={label} className="w-16 h-16 rounded-full object-cover" />
      <span className="text-lg font-black text-slate-700">{label}</span>
      <Link
        to="/icons"
        onClick={() => onDismiss(icon.id)}
        className="text-sm font-bold text-primary underline"
      >
        {t('icons.equip')}
      </Link>
    </div>
  );
};

export const IconUnlockToast: React.FC<IconUnlockToastProps> = ({ icons }) => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const handleDismiss = useCallback((id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  }, []);

  const visible = icons.filter((icon) => !dismissed.has(icon.id));

  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      {visible.map((icon) => (
        <Toast key={icon.id} icon={icon} onDismiss={handleDismiss} />
      ))}
    </div>
  );
};
