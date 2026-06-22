export interface StreakResponse {
  current_count: number;
  played_today: boolean;
  freeze_available_on: string | null;
}

export type AuthorizedFetch = (input: string, init?: RequestInit) => Promise<Response>;

export interface StreakRepository {
  fetchStreak(authorizedFetch: AuthorizedFetch): Promise<StreakResponse>;
}
