import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

const sampleUser = {
  id: 'u1',
  email: 'alice@example.com',
  username: 'alice',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const Probe = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <span>loading</span>;
  }
  return <span>{user ? user.username : 'guest'}</span>;
};

const seedSession = () => {
  localStorage.setItem('hm_access_token', 'old-access');
  localStorage.setItem('hm_refresh_token', 'old-refresh');
  localStorage.setItem('hm_auth_user', JSON.stringify(sampleUser));
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

const renderProbe = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );

describe('AuthProvider hydration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('renders the cached user on first paint while the network is pending', () => {
    seedSession();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => {}))
    );

    renderProbe();

    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('renders guest immediately without any network call when no session exists', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderProbe();

    expect(screen.getByText('guest')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).not.toHaveBeenCalled());
  });

  it('refreshes the session then fetches the fresh profile on mount', async () => {
    seedSession();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/api/v1/auth/refresh')) {
        return jsonResponse({
          access_token: 'new-access',
          refresh_token: 'new-refresh',
          token_type: 'bearer',
        });
      }
      if (url.endsWith('/api/v1/auth/me')) {
        return jsonResponse({ ...sampleUser, username: 'alice-updated' });
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderProbe();

    await waitFor(() => expect(screen.getByText('alice-updated')).toBeInTheDocument());
    expect(localStorage.getItem('hm_refresh_token')).toBe('new-refresh');
    expect(localStorage.getItem('hm_access_token')).toBe('new-access');
  });

  it('downgrades to guest and clears storage when fastauth rejects the session', async () => {
    seedSession();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ detail: 'nope' }, 401))
    );

    renderProbe();

    await waitFor(() => expect(screen.getByText('guest')).toBeInTheDocument());
    expect(localStorage.getItem('hm_access_token')).toBeNull();
    expect(localStorage.getItem('hm_refresh_token')).toBeNull();
    expect(localStorage.getItem('hm_auth_user')).toBeNull();
  });

  it('keeps the optimistic session when the network is down', async () => {
    seedSession();
    const fetchMock = vi.fn(async () => {
      throw new TypeError('offline');
    });
    vi.stubGlobal('fetch', fetchMock);

    renderProbe();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(localStorage.getItem('hm_refresh_token')).toBe('old-refresh');
    expect(localStorage.getItem('hm_auth_user')).not.toBeNull();
  });
});
