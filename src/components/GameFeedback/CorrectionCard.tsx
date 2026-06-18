import React from 'react';
import type { Game } from '../../types';
import { computeFeedback, computeCombo } from '../../lib/feedback';
import { ComboBadge } from './ComboBadge';

interface CorrectionCardProps {
  game: Game;
  playerId: string;
  questionIndex: number;
  countdown: number | null;
}

const titleFor = (status: 'correct' | 'wrong' | 'timeout'): string => {
  if (status === 'correct') return 'Bonne réponse';
  if (status === 'timeout') return 'Temps écoulé';
  return 'Mauvaise réponse';
};

export const CorrectionCard: React.FC<CorrectionCardProps> = ({
  game,
  playerId,
  questionIndex,
  countdown,
}) => {
  const feedback = computeFeedback(game, playerId, questionIndex);
  const question = game.questions[questionIndex];
  if (!feedback || !question) return null;

  const combo = computeCombo(game, playerId, questionIndex);
  const isCorrect = feedback.status === 'correct';

  return (
    <div className="space-y-6 animate-pop-in">
      <div className="text-sm font-semibold uppercase tracking-wider text-slate-400">
        {titleFor(feedback.status)}
      </div>

      <div className="text-3xl font-black text-slate-800">{question.statement}</div>

      <div className="flex items-center justify-center gap-3 text-4xl font-black">
        {feedback.status === 'timeout' ? (
          <span className="text-slate-400">⏱ Pas de réponse</span>
        ) : isCorrect ? (
          <span className="text-green-600">{feedback.given}</span>
        ) : (
          <>
            <span className="text-red-500 line-through">{feedback.given}</span>
            <span className="text-slate-300">→</span>
          </>
        )}
        {!isCorrect && <span className="text-green-600">{feedback.expected}</span>}
      </div>

      {isCorrect && feedback.pointsEarned > 0 && (
        <div className="text-2xl font-black text-green-600">+{feedback.pointsEarned}</div>
      )}

      <div className="flex justify-center">
        <ComboBadge combo={combo} />
      </div>

      {countdown !== null && (
        <div className="text-sm font-bold text-slate-400">Question suivante dans {countdown}…</div>
      )}
    </div>
  );
};
