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
