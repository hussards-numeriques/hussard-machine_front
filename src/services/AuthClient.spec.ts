import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthClient, parseOAuthFragment } from './AuthClient';

describe('parseOAuthFragment', () => {
  it('extracts tokens from a success fragment', () => {
    const hash = '#access_token=abc&refresh_token=def&token_type=bearer';

    const result = parseOAuthFragment(hash);

    expect(result.tokens).toEqual({
      access_token: 'abc',
      refresh_token: 'def',
      token_type: 'bearer',
    });
    expect(result.error).toBeUndefined();
  });

  it('extracts an error message from an error fragment', () => {
    const hash = '#error=boom';

    const result = parseOAuthFragment(hash);

    expect(result.error).toBe('boom');
    expect(result.tokens).toBeUndefined();
  });

  it('returns nothing useful for an empty fragment', () => {
    const result = parseOAuthFragment('');

    expect(result.tokens).toBeUndefined();
    expect(result.error).toBeUndefined();
  });
});

const sampleUser = {
  id: 'u1',
  email: 'alice@example.com',
  username: 'alice',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('AuthClient profile cache', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('returns null when nothing is cached', () => {
    const client = new AuthClient();

    expect(client.getCachedUser()).toBeNull();
  });

  it('round-trips a cached user', () => {
    const client = new AuthClient();

    client.setCachedUser(sampleUser);

    expect(client.getCachedUser()).toEqual(sampleUser);
  });

  it('returns null when the cached payload is not valid JSON', () => {
    localStorage.setItem('hm_auth_user', '{not json');
    const client = new AuthClient();

    expect(client.getCachedUser()).toBeNull();
  });

  it('returns null when the cached payload fails schema validation', () => {
    localStorage.setItem('hm_auth_user', JSON.stringify({ id: 42 }));
    const client = new AuthClient();

    expect(client.getCachedUser()).toBeNull();
  });

  it('clearTokens removes the cached user', () => {
    const client = new AuthClient();
    client.setCachedUser(sampleUser);

    client.clearTokens();

    expect(client.getCachedUser()).toBeNull();
  });

  it('fetchMe caches the returned user', async () => {
    localStorage.setItem('hm_access_token', 'access');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(sampleUser), { status: 200 }))
    );
    const client = new AuthClient();

    await client.fetchMe();

    expect(client.getCachedUser()).toEqual(sampleUser);
  });
});

const seedTokens = () => {
  localStorage.setItem('hm_access_token', 'old-access');
  localStorage.setItem('hm_refresh_token', 'old-refresh');
};

const tokenBody = JSON.stringify({
  access_token: 'new-access',
  refresh_token: 'new-refresh',
  token_type: 'bearer',
});

describe('AuthClient.refreshSession', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('rotates tokens on success', async () => {
    seedTokens();
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(tokenBody, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const client = new AuthClient();

    const result = await client.refreshSession();

    expect(result?.access_token).toBe('new-access');
    expect(client.getAccessToken()).toBe('new-access');
    expect(client.getRefreshToken()).toBe('new-refresh');
    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get('Authorization')).toBe('Bearer old-refresh');
  });

  it('returns null without touching the network when no refresh token exists', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const client = new AuthClient();

    const result = await client.refreshSession();

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clears tokens on a 401 when no other tab rotated them', async () => {
    seedTokens();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 401 }))
    );
    const client = new AuthClient();

    const result = await client.refreshSession();

    expect(result).toBeNull();
    expect(client.getAccessToken()).toBeNull();
    expect(client.getRefreshToken()).toBeNull();
  });

  it('keeps tokens on a non-401 server error', async () => {
    seedTokens();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('boom', { status: 503 }))
    );
    const client = new AuthClient();

    const result = await client.refreshSession();

    expect(result).toBeNull();
    expect(client.getAccessToken()).toBe('old-access');
    expect(client.getRefreshToken()).toBe('old-refresh');
  });

  it('keeps tokens on a network error', async () => {
    seedTokens();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('offline');
      })
    );
    const client = new AuthClient();

    const result = await client.refreshSession();

    expect(result).toBeNull();
    expect(client.getAccessToken()).toBe('old-access');
    expect(client.getRefreshToken()).toBe('old-refresh');
  });

  it('adopts tokens written by another tab when losing the rotation race', async () => {
    seedTokens();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        localStorage.setItem('hm_access_token', 'winner-access');
        localStorage.setItem('hm_refresh_token', 'winner-refresh');
        return new Response('rotated elsewhere', { status: 401 });
      })
    );
    const client = new AuthClient();

    const result = await client.refreshSession();

    expect(result).toEqual({
      access_token: 'winner-access',
      refresh_token: 'winner-refresh',
      token_type: 'bearer',
    });
    expect(client.getAccessToken()).toBe('winner-access');
    expect(client.getRefreshToken()).toBe('winner-refresh');
  });
});
