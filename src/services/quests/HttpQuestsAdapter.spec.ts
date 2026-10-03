import { describe, expect, it, vi } from 'vitest';
import { HttpQuestsAdapter } from './HttpQuestsAdapter';
import type { AuthorizedFetch, MyTitlesResponse, QuestCatalog } from './port';

const catalogSample: QuestCatalog = [
  {
    id: 'win-streak',
    tiers: [
      {
        threshold: 5,
        title: { id: 'win-streak-bronze', rarity: 'BRONZE' },
      },
    ],
  },
];

const myTitlesSample: MyTitlesResponse = {
  level: 'CP',
  current_level: 'TROISIEME',
  selected_title_id: 'win-streak-bronze',
  titles: [
    {
      id: 'win-streak-bronze',
      rarity: 'BRONZE',
      unlocked_at: '2026-07-10T18:42:03',
    },
  ],
  quests: [
    {
      id: 'win-streak',
      progress: 7,
      tiers: [{ threshold: 5, title_id: 'win-streak-bronze', unlocked: true }],
    },
  ],
};

describe('HttpQuestsAdapter', () => {
  it('fetches /quests without an authorizedFetch', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(catalogSample), { status: 200 }));
    const adapter = new HttpQuestsAdapter();

    const result = await adapter.fetchCatalog();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect((fetchSpy.mock.calls[0][0] as string).endsWith('/quests')).toBe(true);
    expect(result).toEqual(catalogSample);
    fetchSpy.mockRestore();
  });

  it('throws when /quests responds with an error status', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('nope', { status: 500 }));
    const adapter = new HttpQuestsAdapter();

    await expect(adapter.fetchCatalog()).rejects.toThrow();
    fetchSpy.mockRestore();
  });

  it('fetches /me/titles without level param for the current level', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(
      async () => new Response(JSON.stringify(myTitlesSample), { status: 200 })
    );

    const result = await new HttpQuestsAdapter().fetchMyTitles(authorizedFetch, null);

    expect((authorizedFetch.mock.calls[0][0] as string).endsWith('/me/titles')).toBe(true);
    expect(result).toEqual(myTitlesSample);
  });

  it('fetches /me/titles for an explicit level', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(
      async () => new Response(JSON.stringify(myTitlesSample), { status: 200 })
    );

    await new HttpQuestsAdapter().fetchMyTitles(authorizedFetch, 'CP');

    expect((authorizedFetch.mock.calls[0][0] as string).endsWith('/me/titles?level=CP')).toBe(true);
  });

  it('rejects a /me/titles response with an unknown level', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(
      async () =>
        new Response(JSON.stringify({ ...myTitlesSample, level: 'LYCEE' }), { status: 200 })
    );

    await expect(new HttpQuestsAdapter().fetchMyTitles(authorizedFetch, null)).rejects.toThrow();
  });

  it('throws when /me/titles responds with an error status', async () => {
    const authorizedFetch = vi.fn(async () => new Response('nope', { status: 401 }));
    const adapter = new HttpQuestsAdapter();

    await expect(adapter.fetchMyTitles(authorizedFetch, null)).rejects.toThrow();
  });

  it('PUTs the title id and level, and returns the selected title id and level', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(
      async () =>
        new Response(
          JSON.stringify({ selected_title_id: 'win-streak-bronze', level: 'TROISIEME' }),
          { status: 200 }
        )
    );
    const adapter = new HttpQuestsAdapter();

    const result = await adapter.selectTitle(authorizedFetch, 'win-streak-bronze', 'TROISIEME');

    expect(authorizedFetch).toHaveBeenCalledTimes(1);
    const [url, init] = authorizedFetch.mock.calls[0];
    expect((url as string).endsWith('/me/selected-title')).toBe(true);
    expect(init?.method).toBe('PUT');
    expect(init?.body).toBe(JSON.stringify({ title_id: 'win-streak-bronze', level: 'TROISIEME' }));
    expect(result).toEqual({ selected_title_id: 'win-streak-bronze', level: 'TROISIEME' });
  });

  it('unequips by sending a null title id', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(
      async () =>
        new Response(JSON.stringify({ selected_title_id: null, level: 'CP' }), { status: 200 })
    );
    const adapter = new HttpQuestsAdapter();

    const result = await adapter.selectTitle(authorizedFetch, null, 'CP');

    const [, init] = authorizedFetch.mock.calls[0];
    expect(init?.body).toBe(JSON.stringify({ title_id: null, level: 'CP' }));
    expect(result).toEqual({ selected_title_id: null, level: 'CP' });
  });

  it('throws when the selection request responds with an error status', async () => {
    const authorizedFetch = vi.fn(async () => new Response('nope', { status: 400 }));
    const adapter = new HttpQuestsAdapter();

    await expect(adapter.selectTitle(authorizedFetch, 'win-streak-bronze', 'CP')).rejects.toThrow();
  });
});
