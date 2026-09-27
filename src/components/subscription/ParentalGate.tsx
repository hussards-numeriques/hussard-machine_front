import React, { useState } from 'react';
import { Button } from '../Button';
import { isCorrectAnswer, pickQuestion } from '../../lib/parentalGate';

interface ParentalGateProps {
  onPass: () => void;
  onCancel: () => void;
}

export const ParentalGate: React.FC<ParentalGateProps> = ({ onPass, onCancel }) => {
  const [question, setQuestion] = useState(() => pickQuestion());
  const [typedAnswer, setTypedAnswer] = useState('');
  const [hasFailed, setHasFailed] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCorrectAnswer(question, typedAnswer)) {
      onPass();
      return;
    }
    setQuestion(pickQuestion(question));
    setTypedAnswer('');
    setHasFailed(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="parental-gate-title"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-slate-100 p-8 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="parental-gate-title" className="text-2xl font-black text-primary-dark">
          Demande à un adulte
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Le paiement est réservé aux adultes. Pour continuer, réponds à cette question :
        </p>
        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-2">
            <span className="block font-bold text-slate-700">{question.prompt}</span>
            <input
              type="text"
              inputMode="numeric"
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              placeholder="Ta réponse"
              autoComplete="off"
              autoFocus
              className="w-full p-3 rounded-xl border-2 border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary-light outline-none transition-all"
            />
          </label>
          {hasFailed && (
            <p className="text-sm font-bold text-rose-600">
              Mauvaise réponse, essaie avec cette question.
            </p>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Valider
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
