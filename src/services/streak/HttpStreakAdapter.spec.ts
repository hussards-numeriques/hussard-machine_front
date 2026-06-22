import { describe, expect, it, vi } from 'vitest';
import { HttpStreakAdapter } from './HttpStreakAdapter';
import type { AuthorizedFetch, StreakResponse } from './port';

const sample: StreakResponse = {
  current_count: 7,
  played_today: false,
  freeze_available_on: '2026-06-28',
};

describe('HttpStreakAdapter', () => {
  it('fetches /me/streak via the provided authorizedFetch and returns the parsed body', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(
      async () => new Response(JSON.stringify(sample), { status: 200 })
    );
    const adapter = new HttpStreakAdapter();

    const result = await adapter.fetchStreak(authorizedFetch);

    expect(authorizedFetch).toHaveBeenCalledTimes(1);
    const calledUrl = authorizedFetch.mock.calls[0][0] as string;
    expect(calledUrl.endsWith('/me/streak')).toBe(true);
    expect(result).toEqual(sample);
  });

  it('throws when the response is not ok', async () => {
    const authorizedFetch = vi.fn(async () => new Response('nope', { status: 401 }));
    const adapter = new HttpStreakAdapter();

    await expect(adapter.fetchStreak(authorizedFetch)).rejects.toThrow();
  });
});
