import React from 'react';
import { Dot, type DotVariant } from './Dot';
import type { AnswerResult } from '../lib/answerDots';

const ANSWER_RESULT_TO_DOT_VARIANT: Record<AnswerResult, DotVariant> = {
  correct: 'success',
  incorrect: 'danger',
  timeout: 'neutral',
};

const ANSWER_RESULT_TO_LABEL: Record<AnswerResult, string> = {
  correct: 'Correcte',
  incorrect: 'Incorrecte',
  timeout: 'Sans réponse',
};

interface AnswerDotsProps {
  results: AnswerResult[];
  maxWidthCh: number;
}

export const AnswerDots: React.FC<AnswerDotsProps> = ({ results, maxWidthCh }) => {
  if (results.length === 0) return null;

  return (
    <div
      data-testid="answer-dots"
      role="list"
      aria-label="Réponses par question"
      className="flex flex-wrap justify-end gap-0.5"
      style={{ maxWidth: `${maxWidthCh}ch` }}
    >
      {results.map((result, index) => (
        <Dot
          key={index}
          variant={ANSWER_RESULT_TO_DOT_VARIANT[result]}
          label={ANSWER_RESULT_TO_LABEL[result]}
        />
      ))}
    </div>
  );
};
