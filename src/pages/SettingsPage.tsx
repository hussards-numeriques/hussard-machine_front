import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useAnswerInputMode } from '../hooks/useAnswerInputMode';
import {
  ANSWER_INPUT_MODES,
  ANSWER_INPUT_MODE_DESCRIPTIONS,
  ANSWER_INPUT_MODE_LABELS,
} from '../components/AnswerInput/mode';

const SettingsNotice: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
      <h1 className="text-3xl font-black text-primary-dark">Réglages</h1>
      <p className="text-slate-600">{message}</p>
      <Link to="/" className="inline-block text-primary font-bold hover:underline">
        Retour à l'accueil
      </Link>
    </div>
  </div>
);

export const SettingsPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [mode, setMode] = useAnswerInputMode();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-lg font-bold animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SettingsNotice message="Connecte-toi pour accéder à tes réglages." />;
  }

  return (
    <div className="min-h-screen p-4 pt-20 max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl shadow-lg border-2 border-slate-100 p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-black text-slate-700">Mode de saisie</h1>
          <p className="text-sm text-slate-400">Ce réglage est propre à cet appareil.</p>
        </div>
        <div className="space-y-3">
          {ANSWER_INPUT_MODES.map((option) => {
            const isActive = option === mode;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                aria-pressed={isActive}
                className={`w-full text-left rounded-2xl border-2 p-4 transition-colors ${
                  isActive
                    ? 'border-primary bg-primary/10'
                    : 'border-slate-100 bg-slate-50 hover:bg-white'
                }`}
              >
                <div className="font-black text-slate-800">{ANSWER_INPUT_MODE_LABELS[option]}</div>
                <div className="text-sm text-slate-500 mt-0.5">
                  {ANSWER_INPUT_MODE_DESCRIPTIONS[option]}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
