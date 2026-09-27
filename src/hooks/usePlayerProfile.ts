import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/useAuth';
import {
  deleteAccount,
  fetchPlayerProfile,
  promotePlayer,
  demotePlayer,
} from '../services/profile';
import { MY_TITLES_QUERY_KEY } from './useQuests';

export const PLAYER_PROFILE_QUERY_KEY = ['player-profile'];

export const usePlayerProfile = () => {
  const { client, isAuthenticated, isLoading } = useAuth();

  return useQuery({
    queryKey: PLAYER_PROFILE_QUERY_KEY,
    queryFn: () => fetchPlayerProfile((input, init) => client.authorizedFetch(input, init)),
    enabled: isAuthenticated && !isLoading,
  });
};

export const usePromotePlayer = () => {
  const { client } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => promotePlayer((input, init) => client.authorizedFetch(input, init)),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: PLAYER_PROFILE_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: MY_TITLES_QUERY_KEY }),
      ]),
  });
};

export const useDemotePlayer = () => {
  const { client } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => demotePlayer((input, init) => client.authorizedFetch(input, init)),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: PLAYER_PROFILE_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: MY_TITLES_QUERY_KEY }),
      ]),
  });
};

export const useDeleteAccount = () => {
  const { client, clearSession } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteAccount((input, init) => client.authorizedFetch(input, init)),
    onSuccess: () => {
      clearSession();
      queryClient.clear();
    },
  });
};
