import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/useAuth';
import { questsRepository } from '../services/quests';
import type { SelectedTitle } from '../services/quests';
import type { Level } from '../lib/grades';

export const QUEST_CATALOG_QUERY_KEY = ['quests-catalog'];
export const MY_TITLES_QUERY_KEY = ['my-titles'];

export const myTitlesQueryKey = (level: Level | null) => [
  ...MY_TITLES_QUERY_KEY,
  level ?? 'current',
];

export const useQuestCatalog = () =>
  useQuery({
    queryKey: QUEST_CATALOG_QUERY_KEY,
    queryFn: () => questsRepository.fetchCatalog(),
    staleTime: Infinity,
  });

export const useMyTitles = (level: Level | null) => {
  const { client, isAuthenticated, isLoading } = useAuth();

  return useQuery({
    queryKey: myTitlesQueryKey(level),
    queryFn: () =>
      questsRepository.fetchMyTitles((input, init) => client.authorizedFetch(input, init), level),
    enabled: isAuthenticated && !isLoading,
    placeholderData: keepPreviousData,
  });
};

export interface SelectTitleInput {
  titleId: string | null;
  level: Level;
}

export const useSelectTitle = () => {
  const { client } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<SelectedTitle, Error, SelectTitleInput>({
    mutationFn: ({ titleId, level }) =>
      questsRepository.selectTitle(
        (input, init) => client.authorizedFetch(input, init),
        titleId,
        level
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_TITLES_QUERY_KEY }),
  });
};
