import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/useAuth';
import { fetchPlayerProfile, promotePlayer } from '../services/profile';

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLAYER_PROFILE_QUERY_KEY }),
  });
};
