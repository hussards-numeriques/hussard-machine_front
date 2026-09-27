import React, { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import posthog from 'posthog-js';
import { useAuth } from './useAuth';
import { streakRepository, type StreakResponse } from '../services/streak';
import { StreakContext, type StreakContextValue } from './StreakContext';

export const StreakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { client, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['streak'],
    queryFn: async () => {
      const previous = queryClient.getQueryData<StreakResponse>(['streak']);
      const streak = await streakRepository.fetchStreak((input, init) =>
        client.authorizedFetch(input, init)
      );
      if (previous && !previous.played_today && streak.played_today) {
        posthog.capture('streak_maintained', { count: streak.current_count });
      }
      return streak;
    },
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
