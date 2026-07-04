import { z } from 'zod';
import type { GameConfig } from '../types';
import { getApiUrl } from './apiConfig';
import { ApiError } from './http';

const gameConfigSchema = z.object({
  experience_per_grade: z.number(),
  promotion_threshold: z.number(),
  grades: z.array(z.string()),
  levels: z.array(z.string()),
}) satisfies z.ZodType<GameConfig>;

export const fetchGameConfig = async (): Promise<GameConfig> => {
  const response = await fetch(`${getApiUrl()}/game/config`);
  if (!response.ok) {
    throw new ApiError(response.status, `Failed to fetch game config (${response.status})`);
  }
  return gameConfigSchema.parse(await response.json());
};
