import React from 'react';
import { Button } from './Button';

export type LevelChangeVariant = 'promote' | 'demote';

interface LevelChangeConfirmModalProps {
  variant: LevelChangeVariant;
  targetLevel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface LevelChangeCopy {
  title: (targetLevel: string) => string;
  message: string;
  confirmVariant: 'success' | 'secondary';
}

const LEVEL_CHANGE_COPY: Record<LevelChangeVariant, LevelChangeCopy> = {
  promote: {
    title: (targetLevel) => `Passer en ${targetLevel} ?`,
    message: 'Les calculs vont devenir plus difficiles.',
    confirmVariant: 'success',
  },
  demote: {
    title: (targetLevel) => `Redescendre en ${targetLevel} ?`,
    message:
      "Tu vas perdre l'XP de ton niveau actuel — tu repars avec juste assez d'XP pour repasser ce niveau immédiatement si tu veux. Les calculs seront plus simples, mais moins de défi.",
    confirmVariant: 'secondary',
  },
};

export const LevelChangeConfirmModal: React.FC<LevelChangeConfirmModalProps> = ({
  variant,
  targetLevel,
  onConfirm,
  onCancel,
}) => {
  const copy = LEVEL_CHANGE_COPY[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-slate-100 p-8 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-black text-primary-dark">{copy.title(targetLevel)}</h2>
        <p className="text-slate-600 text-sm leading-relaxed">{copy.message}</p>
        <div className="flex gap-3">
          <Button type="button" variant="primary" className="flex-1" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            type="button"
            variant={copy.confirmVariant}
            className="flex-1"
            onClick={onConfirm}
          >
            Confirmer
          </Button>
        </div>
      </div>
    </div>
  );
};
