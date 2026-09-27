import React, { useState } from 'react';
import { Button } from './Button';

interface DeleteAccountModalProps {
  username: string;
  isDeleting: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const DELETED_DATA = [
  'ton profil, ton niveau et ton XP',
  'ton historique de parties et ta série de jours',
  'tes quêtes, titres et icônes débloqués',
  'ton abonnement en cours et ses avantages',
  'ton compte de connexion (identifiant, e-mail, mot de passe)',
];

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  username,
  isDeleting,
  errorMessage,
  onConfirm,
  onCancel,
}) => {
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
          Supprimer ton compte ?
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Cette action est <strong>définitive</strong>. Toutes tes données seront effacées
          immédiatement, et <strong>aucune récupération ne sera possible</strong>, même en
          contactant le support :
        </p>
        <ul className="list-disc pl-5 text-slate-600 text-sm space-y-1">
          {DELETED_DATA.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <label className="block space-y-2">
          <span className="text-sm font-bold text-slate-700">
            Pour confirmer, tape ton pseudo : <span className="text-rose-600">{username}</span>
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
            Annuler
          </Button>
          <Button
            type="button"
            variant="danger"
            className="flex-1"
            onClick={onConfirm}
            disabled={!canConfirm}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
          </Button>
        </div>
      </div>
    </div>
  );
};
