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

export const useCountdown = (
  durationSeconds: number | null,
  startTimeSeconds: number | null
): number | null => {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (durationSeconds === null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemaining(computeRemainingSeconds(durationSeconds, startTimeSeconds));
    const interval = window.setInterval(() => {
      setRemaining(computeRemainingSeconds(durationSeconds, startTimeSeconds));
    }, 250);
    return () => window.clearInterval(interval);
  }, [durationSeconds, startTimeSeconds]);

  return durationSeconds === null ? null : remaining;
};
