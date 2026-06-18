import React from 'react';
import { cn } from '../../lib/utils';

interface AnswerFeedbackPopProps {
  isCorrect: boolean;
  pointsEarned: number;
}

export const AnswerFeedbackPop: React.FC<AnswerFeedbackPopProps> = ({
  isCorrect,
  pointsEarned,
}) => {
  const [faded, setFaded] = React.useState(false);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setFaded(true), 1000);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <div
      className={cn(
        'text-4xl font-black transition-opacity duration-500',
        isCorrect ? 'text-green-600 animate-pop-in' : 'text-red-500 animate-shake',
        faded && 'opacity-0'
      )}
    >
      {isCorrect ? `+${pointsEarned}` : 'Raté'}
    </div>
  );
};
