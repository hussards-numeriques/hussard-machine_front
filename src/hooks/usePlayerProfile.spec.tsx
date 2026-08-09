import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePromotePlayer, useDemotePlayer } from './usePlayerProfile';

const mocks = vi.hoisted(() => ({
  promotePlayer: vi.fn(),
  demotePlayer: vi.fn(),
}));

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    client: { authorizedFetch: vi.fn() },
    user: null,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    reloadUser: vi.fn(),
  }),
}));

vi.mock('../services/profile', () => ({
  fetchPlayerProfile: vi.fn(),
  promotePlayer: mocks.promotePlayer,
  demotePlayer: mocks.demotePlayer,
}));

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('usePromotePlayer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls profile.promotePlayer on mutate', async () => {
    mocks.promotePlayer.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePromotePlayer(), { wrapper });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.promotePlayer).toHaveBeenCalledTimes(1);
  });
});

describe('useDemotePlayer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls profile.demotePlayer on mutate', async () => {
    mocks.demotePlayer.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDemotePlayer(), { wrapper });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.demotePlayer).toHaveBeenCalledTimes(1);
  });
});
