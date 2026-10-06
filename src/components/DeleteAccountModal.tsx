import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Button } from './Button';

interface DeleteAccountModalProps {
  username: string;
  isDeleting: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const DELETED_DATA = [
  'deleteAccount.data.profile',
  'deleteAccount.data.history',
  'deleteAccount.data.quests',
  'deleteAccount.data.subscription',
  'deleteAccount.data.login',
] as const;

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  username,
  isDeleting,
  errorMessage,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [typedUsername, setTypedUsername] = useState('');
  const canConfirm = typedUsername === username && !isDeleting;
  const cancelUnlessDeleting = () => {
    if (!isDeleting) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={cancelUnlessDeleting}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-rose-200 p-8 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="delete-account-title" className="text-2xl font-black text-rose-600">
          {t('deleteAccount.title')}
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          <Trans i18nKey="deleteAccount.warning" components={{ strong: <strong /> }} />
        </p>
        <ul className="list-disc pl-5 text-slate-600 text-sm space-y-1">
          {DELETED_DATA.map((item) => (
            <li key={item}>{t(item)}</li>
          ))}
        </ul>
        <label className="block space-y-2">
          <span className="text-sm font-bold text-slate-700">
            <Trans
              i18nKey="deleteAccount.confirmPrompt"
              values={{ username }}
              components={{ highlight: <span className="text-rose-600" /> }}
            />
          </span>
          <input
            type="text"
            value={typedUsername}
            onChange={(e) => setTypedUsername(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled={isDeleting}
            className="w-full p-3 rounded-xl border-2 border-slate-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 outline-none transition-all"
          />
        </label>
        {errorMessage && <p className="text-xs text-red-500 text-center">{errorMessage}</p>}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="primary"
            className="flex-1"
            onClick={onCancel}
            disabled={isDeleting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="danger"
            className="flex-1"
            onClick={onConfirm}
            disabled={!canConfirm}
          >
            {isDeleting ? t('deleteAccount.deleting') : t('deleteAccount.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
};
