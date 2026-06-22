import type { AuthorizedFetch, StreakRepository, StreakResponse } from './port';

const getApiUrl = (): string => {
  const url = import.meta.env.VITE_API_URL ?? '';
  return typeof url === 'string' && url.endsWith('/') ? url.slice(0, -1) : (url as string);
};

export class HttpStreakAdapter implements StreakRepository {
  public async fetchStreak(authorizedFetch: AuthorizedFetch): Promise<StreakResponse> {
    const response = await authorizedFetch(`${getApiUrl()}/me/streak`);
    if (!response.ok) {
      throw new Error(`Failed to fetch streak (${response.status})`);
    }
    return (await response.json()) as StreakResponse;
  }
}
