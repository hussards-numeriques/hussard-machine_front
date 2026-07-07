import React from 'react';
import { cn } from '../../lib/utils';

interface AnimatedScoreProps {
  score: number;
}

export const AnimatedScore: React.FC<AnimatedScoreProps> = ({ score }) => {
  const [pulse, setPulse] = React.useState(false);
  const previousScore = React.useRef(score);

  React.useEffect(() => {
    if (score === previousScore.current) return;
    previousScore.current = score;
    setPulse(true);
    const timeout = window.setTimeout(() => setPulse(false), 400);
    return () => window.clearTimeout(timeout);
  }, [score]);

  return (
    <span className={cn('shrink-0 tabular-nums', pulse && 'animate-score-pulse text-green-600')}>
      {score} pts
    </span>
  );
};
