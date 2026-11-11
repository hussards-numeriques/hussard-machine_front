import { useEffect } from 'react';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/useAuth';
import { ApiError, type AuthorizedFetch } from '../services/http';
import {
  fetchPracticeCatalog,
  fetchPracticeQuestion,
  fetchPracticeTimesTables,
  type PracticeTopic,
} from '../services/practice';
import type { PlayerIcon } from '../services/icons';
import {
  currentQuestionIndex,
  isLastQuestion,
  isSeriesFinished,
  type PracticeSeries,
} from '../lib/practice';
import { SUBSCRIPTION_STATUS_QUERY_KEY } from './useSubscription';

export const PRACTICE_CATALOG_QUERY_KEY = ['practice-catalog'];

export const PRACTICE_TIMES_TABLES_QUERY_KEY = ['practice-times-tables'];

export const isSubscriptionRequiredError = (error: unknown): boolean =>
  error instanceof ApiError && error.code === 'SUBSCRIPTION_REQUIRED';

const refreshSubscriptionOnExpiry =
  (queryClient: QueryClient) =>
  (error: unknown): never => {
    if (isSubscriptionRequiredError(error)) {
      void queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_STATUS_QUERY_KEY });
    }
    throw error;
  };

const useAuthorizedFetch = (): AuthorizedFetch => {
  const { client } = useAuth();
  return (input, init) => client.authorizedFetch(input, init);
};

export const usePracticeCatalog = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const authorizedFetch = useAuthorizedFetch();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: PRACTICE_CATALOG_QUERY_KEY,
    queryFn: () =>
      fetchPracticeCatalog(authorizedFetch).catch(refreshSubscriptionOnExpiry(queryClient)),
    enabled: isAuthenticated && !isLoading,
    staleTime: Infinity,
  });
};

export const usePracticeTimesTables = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const authorizedFetch = useAuthorizedFetch();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: PRACTICE_TIMES_TABLES_QUERY_KEY,
    queryFn: () =>
      fetchPracticeTimesTables(authorizedFetch).catch(refreshSubscriptionOnExpiry(queryClient)),
    enabled: isAuthenticated && !isLoading,
    staleTime: Infinity,
  });
};

const usePracticeQuestionAt = (
  topic: PracticeTopic,
  runId: number,
  index: number,
  enabled: boolean,
  onIconUnlocked: (icon: PlayerIcon) => void
) => {
  const authorizedFetch = useAuthorizedFetch();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['practice-question', runId, index],
    queryFn: () =>
      fetchPracticeQuestion(authorizedFetch, topic).catch(refreshSubscriptionOnExpiry(queryClient)),
    enabled,
    staleTime: Infinity,
  });
  const unlockedIcon = query.data?.unlockedIcon;

  useEffect(() => {
    if (unlockedIcon) onIconUnlocked(unlockedIcon);
  }, [unlockedIcon, onIconUnlocked]);

  return query;
};

export const usePracticeQuestion = (
  series: PracticeSeries,
  onIconUnlocked: (icon: PlayerIcon) => void
) => {
  const index = currentQuestionIndex(series);
  const current = usePracticeQuestionAt(
    series.topic,
    series.runId,
    index,
    !isSeriesFinished(series),
    onIconUnlocked
  );
  usePracticeQuestionAt(
    series.topic,
    series.runId,
    index + 1,
    current.isSuccess && !isLastQuestion(series),
    onIconUnlocked
  );
  return current;
};
