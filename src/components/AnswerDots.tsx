import React from 'react';
import { Dot, type DotVariant } from './Dot';
import type { AnswerResult } from '../lib/answerDots';

const ANSWER_RESULT_TO_DOT_VARIANT: Record<AnswerResult, DotVariant> = {
  correct: 'success',
  incorrect: 'danger',
  unanswered: 'neutral',
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
      className="flex flex-wrap justify-end gap-0.5"
      style={{ maxWidth: `${maxWidthCh}ch` }}
    >
      {results.map((result, index) => (
        <Dot key={index} variant={ANSWER_RESULT_TO_DOT_VARIANT[result]} />
      ))}
    </div>
  );
};
