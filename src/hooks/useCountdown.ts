import React from 'react';

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
  const [remaining, setRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (durationSeconds === null) {
      setRemaining(null);
      return;
    }
    setRemaining(computeRemainingSeconds(durationSeconds, startTimeSeconds));
    const interval = window.setInterval(() => {
      setRemaining(computeRemainingSeconds(durationSeconds, startTimeSeconds));
    }, 250);
    return () => window.clearInterval(interval);
  }, [durationSeconds, startTimeSeconds]);

  return remaining;
};
