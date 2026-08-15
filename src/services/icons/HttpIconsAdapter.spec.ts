import { describe, expect, it, vi } from 'vitest';
import { HttpIconsAdapter } from './HttpIconsAdapter';
import type { AuthorizedFetch, IconCatalog, MyIconsResponse } from './port';

const catalogSample: IconCatalog = [
  {
    id: 'subscriber-star',
    name: 'Étoile Abonné',
    rarity: 'GOLD',
    url: 'http://localhost:8000/static/icons/subscriber-star.svg',
  },
];

const myIconsSample: MyIconsResponse = {
  selected_icon_id: 'subscriber-star',
  icons: [
    {
      id: 'subscriber-star',
      name: 'Étoile Abonné',
      rarity: 'GOLD',
      url: 'http://localhost:8000/static/icons/subscriber-star.svg',
      unlocked_at: '2026-08-15T10:00:00Z',
    },
  ],
};

describe('HttpIconsAdapter', () => {
  it('fetches /icons without an authorizedFetch', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(catalogSample), { status: 200 }));
    const adapter = new HttpIconsAdapter();

    const result = await adapter.fetchCatalog();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect((fetchSpy.mock.calls[0][0] as string).endsWith('/icons')).toBe(true);
    expect(result).toEqual(catalogSample);
    fetchSpy.mockRestore();
  });

  it('throws when /icons responds with an error status', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('nope', { status: 500 }));
    const adapter = new HttpIconsAdapter();

    await expect(adapter.fetchCatalog()).rejects.toThrow();
    fetchSpy.mockRestore();
  });

  it('fetches /me/icons via the provided authorizedFetch', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(
      async () => new Response(JSON.stringify(myIconsSample), { status: 200 })
    );
    const adapter = new HttpIconsAdapter();

    const result = await adapter.fetchMyIcons(authorizedFetch);

    expect(authorizedFetch).toHaveBeenCalledTimes(1);
    expect((authorizedFetch.mock.calls[0][0] as string).endsWith('/me/icons')).toBe(true);
    expect(result).toEqual(myIconsSample);
  });

  it('throws when /me/icons responds with an error status', async () => {
    const authorizedFetch = vi.fn(async () => new Response('nope', { status: 401 }));
    const adapter = new HttpIconsAdapter();

    await expect(adapter.fetchMyIcons(authorizedFetch)).rejects.toThrow();
  });

  it('PUTs the icon id and returns the selected icon id', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(
      async () =>
        new Response(JSON.stringify({ selected_icon_id: 'subscriber-star' }), { status: 200 })
    );
    const adapter = new HttpIconsAdapter();

    const result = await adapter.selectIcon(authorizedFetch, 'subscriber-star');

    expect(authorizedFetch).toHaveBeenCalledTimes(1);
    const [url, init] = authorizedFetch.mock.calls[0];
    expect((url as string).endsWith('/me/selected-icon')).toBe(true);
    expect(init?.method).toBe('PUT');
    expect(init?.body).toBe(JSON.stringify({ icon_id: 'subscriber-star' }));
    expect(result).toBe('subscriber-star');
  });

  it('unequips by sending a null icon id', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(
      async () => new Response(JSON.stringify({ selected_icon_id: null }), { status: 200 })
    );
    const adapter = new HttpIconsAdapter();

    const result = await adapter.selectIcon(authorizedFetch, null);

    const [, init] = authorizedFetch.mock.calls[0];
    expect(init?.body).toBe(JSON.stringify({ icon_id: null }));
    expect(result).toBeNull();
  });

  it('throws when the selection request responds with an error status', async () => {
    const authorizedFetch = vi.fn(async () => new Response('nope', { status: 400 }));
    const adapter = new HttpIconsAdapter();

    await expect(adapter.selectIcon(authorizedFetch, 'subscriber-star')).rejects.toThrow();
  });
});
