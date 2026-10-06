import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { Game } from '../../types';
import { computeFeedback } from '../../lib/feedback';
import type { AnswerResult } from '../../lib/playerAnswer';
import { QuestionPrompt } from '../QuestionPrompt/QuestionPrompt';
import { formatInteger } from '../../lib/mathFormat';

interface CorrectionCardProps {
  game: Game;
  playerId: string;
  questionIndex: number;
  countdown: number | null;
}

const titleFor = (status: AnswerResult, t: TFunction): string => {
  if (status === 'correct') return t('feedback.correct');
  if (status === 'timeout') return t('feedback.timeout');
  return t('feedback.wrong');
};

export const CorrectionCard: React.FC<CorrectionCardProps> = ({
  game,
  playerId,
  questionIndex,
  countdown,
}) => {
  const { t } = useTranslation();
  const feedback = computeFeedback(game, playerId, questionIndex);
  const question = game.questions[questionIndex];
  if (!feedback || !question) return null;

  const isCorrect = feedback.status === 'correct';
  const isLastQuestion = questionIndex === game.questions.length - 1;

  return (
    <div className="space-y-6 animate-pop-in">
      <div className="text-sm font-semibold uppercase tracking-wider text-slate-400">
        {titleFor(feedback.status, t)}
      </div>

      <QuestionPrompt prompt={question.prompt} className="text-3xl" />

      {!isCorrect && (
        <div className="flex items-center justify-center gap-3 text-4xl font-black">
          {feedback.status === 'timeout' ? (
            <span className="text-slate-400">{t('feedback.noAnswer')}</span>
          ) : (
            <>
              <span className="text-red-500 line-through">
                {feedback.given === null ? null : formatInteger(feedback.given)}
              </span>
              <span className="text-slate-300">→</span>
            </>
          )}
          <span className="text-green-600">{formatInteger(feedback.expected)}</span>
        </div>
      )}

      {isCorrect && feedback.pointsEarned > 0 && (
        <div className="text-2xl font-black text-green-600">+{feedback.pointsEarned}</div>
      )}

      {countdown !== null && (
        <div className="text-sm font-bold text-slate-400">
          {t(isLastQuestion ? 'feedback.podium' : 'feedback.nextQuestion', { seconds: countdown })}
        </div>
      )}
    </div>
  );
};
