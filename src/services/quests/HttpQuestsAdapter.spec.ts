import { describe, expect, it, vi } from 'vitest';
import { HttpQuestsAdapter } from './HttpQuestsAdapter';
import type { AuthorizedFetch, MyTitlesResponse, QuestCatalog } from './port';

const catalogSample: QuestCatalog = [
  {
    id: 'win-streak',
    label: "Terminer 1er en parties d'affilée",
    tiers: [
      {
        threshold: 5,
        title: { id: 'win-streak-bronze', label: 'Petit Conquérant', rarity: 'BRONZE' },
      },
    ],
  },
];

const myTitlesSample: MyTitlesResponse = {
  selected_title_id: 'win-streak-bronze',
  titles: [
    {
      id: 'win-streak-bronze',
      label: 'Petit Conquérant',
      rarity: 'BRONZE',
      unlocked_at: '2026-07-10T18:42:03',
    },
  ],
  quests: [
    {
      id: 'win-streak',
      label: "Terminer 1er en parties d'affilée",
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

  it('fetches /me/titles via the provided authorizedFetch', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(
      async () => new Response(JSON.stringify(myTitlesSample), { status: 200 })
    );
    const adapter = new HttpQuestsAdapter();

    const result = await adapter.fetchMyTitles(authorizedFetch);

    expect(authorizedFetch).toHaveBeenCalledTimes(1);
    expect((authorizedFetch.mock.calls[0][0] as string).endsWith('/me/titles')).toBe(true);
    expect(result).toEqual(myTitlesSample);
  });

  it('throws when /me/titles responds with an error status', async () => {
    const authorizedFetch = vi.fn(async () => new Response('nope', { status: 401 }));
    const adapter = new HttpQuestsAdapter();

    await expect(adapter.fetchMyTitles(authorizedFetch)).rejects.toThrow();
  });

  it('PUTs the title id and returns the selected title id', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(
      async () =>
        new Response(JSON.stringify({ selected_title_id: 'win-streak-bronze' }), { status: 200 })
    );
    const adapter = new HttpQuestsAdapter();

    const result = await adapter.selectTitle(authorizedFetch, 'win-streak-bronze');

    expect(authorizedFetch).toHaveBeenCalledTimes(1);
    const [url, init] = authorizedFetch.mock.calls[0];
    expect((url as string).endsWith('/me/selected-title')).toBe(true);
    expect(init?.method).toBe('PUT');
    expect(init?.body).toBe(JSON.stringify({ title_id: 'win-streak-bronze' }));
    expect(result).toBe('win-streak-bronze');
  });

  it('unequips by sending a null title id', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(
      async () => new Response(JSON.stringify({ selected_title_id: null }), { status: 200 })
    );
    const adapter = new HttpQuestsAdapter();

    const result = await adapter.selectTitle(authorizedFetch, null);

    const [, init] = authorizedFetch.mock.calls[0];
    expect(init?.body).toBe(JSON.stringify({ title_id: null }));
    expect(result).toBeNull();
  });

  it('throws when the selection request responds with an error status', async () => {
    const authorizedFetch = vi.fn(async () => new Response('nope', { status: 400 }));
    const adapter = new HttpQuestsAdapter();

    await expect(adapter.selectTitle(authorizedFetch, 'win-streak-bronze')).rejects.toThrow();
  });
});
