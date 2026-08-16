import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/useAuth';
import { iconsRepository } from '../services/icons';
import { PLAYER_PROFILE_QUERY_KEY } from './usePlayerProfile';

export const ICON_CATALOG_QUERY_KEY = ['icons-catalog'];
export const MY_ICONS_QUERY_KEY = ['my-icons'];

export const useIconCatalog = () =>
  useQuery({
    queryKey: ICON_CATALOG_QUERY_KEY,
    queryFn: () => iconsRepository.fetchCatalog(),
    staleTime: Infinity,
  });

export const useMyIcons = () => {
  const { client, isAuthenticated, isLoading } = useAuth();

  return useQuery({
    queryKey: MY_ICONS_QUERY_KEY,
    queryFn: () =>
      iconsRepository.fetchMyIcons((input, init) => client.authorizedFetch(input, init)),
    enabled: isAuthenticated && !isLoading,
  });
};

export const useSelectIcon = () => {
  const { client } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (iconId: string | null) =>
      iconsRepository.selectIcon((input, init) => client.authorizedFetch(input, init), iconId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_ICONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PLAYER_PROFILE_QUERY_KEY });
    },
  });
};
