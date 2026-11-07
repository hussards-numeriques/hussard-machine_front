import { useEffect, useState } from 'react';

export const computeRemainingSeconds = (
  durationSeconds: number,
  startTimeSeconds: number | null
): number => {
  if (startTimeSeconds === null) return durationSeconds;
  const elapsed = Date.now() / 1000 - startTimeSeconds;
  const remaining = durationSeconds - elapsed;
  return Math.max(0, Math.ceil(remaining));
};

const readRemaining = (
  durationSeconds: number | null,
  startTimeSeconds: number | null
): number | null =>
  durationSeconds === null ? null : computeRemainingSeconds(durationSeconds, startTimeSeconds);

export const useCountdown = (
  durationSeconds: number | null,
  startTimeSeconds: number | null
): number | null => {
  const [tracked, setTracked] = useState({ durationSeconds, startTimeSeconds });
  const [remaining, setRemaining] = useState(() =>
    readRemaining(durationSeconds, startTimeSeconds)
  );

  const hasChanged =
    tracked.durationSeconds !== durationSeconds || tracked.startTimeSeconds !== startTimeSeconds;
  const current = hasChanged ? readRemaining(durationSeconds, startTimeSeconds) : remaining;
  if (hasChanged) {
    setTracked({ durationSeconds, startTimeSeconds });
    setRemaining(current);
  }

  useEffect(() => {
    if (durationSeconds === null) return;
    const interval = window.setInterval(() => {
      setRemaining(computeRemainingSeconds(durationSeconds, startTimeSeconds));
    }, 250);
    return () => window.clearInterval(interval);
  }, [durationSeconds, startTimeSeconds]);

  return current;
};
