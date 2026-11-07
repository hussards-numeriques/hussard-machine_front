import type { FC } from 'react';
import { useEffect } from 'react';
import { useSound } from '../hooks/useSound';

export const CountdownBadge: FC<{ remainingSeconds: number; ticking: boolean }> = ({
  remainingSeconds,
  ticking,
}) => {
  const play = useSound();
  const isLow = remainingSeconds <= 3;
  const shouldTick = ticking && isLow && remainingSeconds > 0;

  useEffect(() => {
    if (shouldTick) play('tick');
  }, [shouldTick, remainingSeconds, play]);

  return (
    <span className={`tabular-nums font-bold ${isLow ? 'text-red-500' : 'text-slate-400'}`}>
      {remainingSeconds}s
    </span>
  );
};
