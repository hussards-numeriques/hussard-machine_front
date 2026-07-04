import React, { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { streakRepository } from '../services/streak';
import { StreakContext, type StreakContextValue } from './StreakContext';

export const StreakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { client, isAuthenticated } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['streak'],
    queryFn: () =>
      streakRepository.fetchStreak((input, init) => client.authorizedFetch(input, init)),
    enabled: isAuthenticated,
  });

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const value: StreakContextValue = useMemo(
    () => ({ streak: isAuthenticated ? (data ?? null) : null, isLoading, refresh }),
    [data, isAuthenticated, isLoading, refresh]
  );

  return <StreakContext.Provider value={value}>{children}</StreakContext.Provider>;
};
