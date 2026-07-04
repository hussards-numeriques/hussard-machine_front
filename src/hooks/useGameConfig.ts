import { useQuery } from '@tanstack/react-query';
import { fetchGameConfig } from '../services/gameConfig';

export const useGameConfig = () =>
  useQuery({
    queryKey: ['game-config'],
    queryFn: fetchGameConfig,
    staleTime: Infinity,
  });
