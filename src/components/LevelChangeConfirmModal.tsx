import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

export type LevelChangeVariant = 'promote' | 'demote';

interface LevelChangeConfirmModalProps {
  variant: LevelChangeVariant;
  targetLevel: string;
  currentLevel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const CONFIRM_VARIANT: Record<LevelChangeVariant, 'success' | 'secondary'> = {
  promote: 'success',
  demote: 'secondary',
};

export const LevelChangeConfirmModal: React.FC<LevelChangeConfirmModalProps> = ({
  variant,
  targetLevel,
  currentLevel,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-slate-100 p-8 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-black text-primary-dark">
          {t(`levelChange.${variant}.title`, { level: targetLevel })}
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          {t(`levelChange.${variant}.message`)}
        </p>
        <p className="text-slate-600 text-sm leading-relaxed">
          {t(`levelChange.${variant}.titles`, { target: targetLevel, current: currentLevel })}
        </p>
        <div className="flex gap-3">
          <Button type="button" variant="primary" className="flex-1" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant={CONFIRM_VARIANT[variant]}
            className="flex-1"
            onClick={onConfirm}
          >
            {t('common.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
};
