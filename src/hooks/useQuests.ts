import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/useAuth';
import { questsRepository } from '../services/quests';

export const QUEST_CATALOG_QUERY_KEY = ['quests-catalog'];
export const MY_TITLES_QUERY_KEY = ['my-titles'];

export const useQuestCatalog = () =>
  useQuery({
    queryKey: QUEST_CATALOG_QUERY_KEY,
    queryFn: () => questsRepository.fetchCatalog(),
    staleTime: Infinity,
  });

export const useMyTitles = () => {
  const { client, isAuthenticated, isLoading } = useAuth();

  return useQuery({
    queryKey: MY_TITLES_QUERY_KEY,
    queryFn: () =>
      questsRepository.fetchMyTitles((input, init) => client.authorizedFetch(input, init)),
    enabled: isAuthenticated && !isLoading,
  });
};

export const useSelectTitle = () => {
  const { client } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (titleId: string | null) =>
      questsRepository.selectTitle((input, init) => client.authorizedFetch(input, init), titleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_TITLES_QUERY_KEY }),
  });
};
