import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import { streakRepository, type StreakResponse } from '../services/streak';
import { StreakContext, type StreakContextValue } from './StreakContext';

export const StreakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { client, isAuthenticated } = useAuth();
  const [streak, setStreak] = useState<StreakResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setStreak(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await streakRepository.fetchStreak((input, init) =>
        client.authorizedFetch(input, init)
      );
      setStreak(data);
    } catch {
      setStreak(null);
    } finally {
      setIsLoading(false);
    }
  }, [client, isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value: StreakContextValue = useMemo(
    () => ({ streak, isLoading, refresh }),
    [streak, isLoading, refresh]
  );

  return <StreakContext.Provider value={value}>{children}</StreakContext.Provider>;
};
