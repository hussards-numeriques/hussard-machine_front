import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/useAuth';
import { ApiError, type AuthorizedFetch } from '../services/http';
import {
  fetchPracticeCatalog,
  fetchPracticeQuestion,
  type PracticeNotion,
} from '../services/practice';
import {
  currentQuestionIndex,
  isLastQuestion,
  isSeriesFinished,
  type PracticeSeries,
} from '../lib/practice';
import { SUBSCRIPTION_STATUS_QUERY_KEY } from './useSubscription';

export const PRACTICE_CATALOG_QUERY_KEY = ['practice-catalog'];

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

const usePracticeQuestionAt = (
  notion: PracticeNotion,
  runId: number,
  index: number,
  enabled: boolean
) => {
  const authorizedFetch = useAuthorizedFetch();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['practice-question', runId, index],
    queryFn: () =>
      fetchPracticeQuestion(authorizedFetch, notion).catch(
        refreshSubscriptionOnExpiry(queryClient)
      ),
    enabled,
    staleTime: Infinity,
  });
};

export const usePracticeQuestion = (series: PracticeSeries) => {
  const index = currentQuestionIndex(series);
  const current = usePracticeQuestionAt(
    series.notion,
    series.runId,
    index,
    !isSeriesFinished(series)
  );
  usePracticeQuestionAt(
    series.notion,
    series.runId,
    index + 1,
    current.isSuccess && !isLastQuestion(series)
  );
  return current;
};
