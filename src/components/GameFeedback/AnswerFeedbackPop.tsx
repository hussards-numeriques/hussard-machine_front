import React from 'react';
import { cn } from '../../lib/utils';

interface AnswerFeedbackPopProps {
  isCorrect: boolean;
  pointsEarned: number;
}

export const AnswerFeedbackPop: React.FC<AnswerFeedbackPopProps> = ({
  isCorrect,
  pointsEarned,
}) => (
  <div
    className={cn(
      'text-4xl font-black',
      isCorrect ? 'text-green-600 animate-pop-in' : 'text-red-500 animate-shake'
    )}
  >
    {isCorrect ? `+${pointsEarned}` : 'Raté'}
  </div>
);
