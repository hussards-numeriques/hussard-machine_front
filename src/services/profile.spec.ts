import { describe, expect, it, vi } from 'vitest';
import { promotePlayer, demotePlayer, deleteAccount } from './profile';
import type { AuthorizedFetch } from './http';

describe('promotePlayer', () => {
  it('POSTs to /me/promote via the provided authorizedFetch', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(async () => new Response(null, { status: 200 }));

    await promotePlayer(authorizedFetch);

    expect(authorizedFetch).toHaveBeenCalledTimes(1);
    const [url, init] = authorizedFetch.mock.calls[0];
    expect((url as string).endsWith('/me/promote')).toBe(true);
    expect(init?.method).toBe('POST');
  });

  it('throws when /me/promote responds with an error status', async () => {
    const authorizedFetch = vi.fn(async () => new Response('nope', { status: 400 }));

    await expect(promotePlayer(authorizedFetch)).rejects.toThrow();
  });
});

describe('demotePlayer', () => {
  it('POSTs to /me/demote via the provided authorizedFetch', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(async () => new Response(null, { status: 200 }));

    await demotePlayer(authorizedFetch);

    expect(authorizedFetch).toHaveBeenCalledTimes(1);
    const [url, init] = authorizedFetch.mock.calls[0];
    expect((url as string).endsWith('/me/demote')).toBe(true);
    expect(init?.method).toBe('POST');
  });

  it('throws when /me/demote responds with an error status', async () => {
    const authorizedFetch = vi.fn(async () => new Response('nope', { status: 400 }));

    await expect(demotePlayer(authorizedFetch)).rejects.toThrow();
  });
});

describe('deleteAccount', () => {
  it('DELETEs /me via the provided authorizedFetch', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(async () => new Response(null, { status: 204 }));

    await deleteAccount(authorizedFetch);

    expect(authorizedFetch).toHaveBeenCalledTimes(1);
    const [url, init] = authorizedFetch.mock.calls[0];
    expect((url as string).endsWith('/me')).toBe(true);
    expect(init?.method).toBe('DELETE');
  });

  it('throws when /me responds with an error status', async () => {
    const authorizedFetch = vi.fn(async () => new Response('nope', { status: 502 }));

    await expect(deleteAccount(authorizedFetch)).rejects.toThrow();
  });
});
