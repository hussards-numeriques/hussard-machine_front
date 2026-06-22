import { useEffect, useState } from 'react';

const pad = (n: number): string => String(n).padStart(2, '0');

const formatRemaining = (now: Date): string => {
  const target = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0);
  const diffSeconds = Math.max(0, Math.round((target - now.getTime()) / 1000));
  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const calculateInitialValue = (): string => formatRemaining(new Date());

export function useUtcMidnightCountdown(active: boolean): string {
  const [formatted, setFormatted] = useState(calculateInitialValue);

  useEffect(() => {
    if (!active) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormatted(formatRemaining(new Date()));
    const interval = setInterval(() => {
      setFormatted(formatRemaining(new Date()));
    }, 1000);
    return () => clearInterval(interval);
  }, [active]);

  return formatted;
}
