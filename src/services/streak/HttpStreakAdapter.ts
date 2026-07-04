import { z } from 'zod';
import type { AuthorizedFetch, StreakRepository, StreakResponse } from './port';
import { getApiUrl } from '../apiConfig';

const streakResponseSchema = z.object({
  current_count: z.number(),
  played_today: z.boolean(),
  freeze_available_on: z.string().nullable(),
}) satisfies z.ZodType<StreakResponse>;

export class HttpStreakAdapter implements StreakRepository {
  public async fetchStreak(authorizedFetch: AuthorizedFetch): Promise<StreakResponse> {
    const response = await authorizedFetch(`${getApiUrl()}/me/streak`);
    if (!response.ok) {
      throw new Error(`Failed to fetch streak (${response.status})`);
    }
    return streakResponseSchema.parse(await response.json());
  }
}
