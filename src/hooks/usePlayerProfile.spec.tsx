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

  it('invalidates the player profile and my-titles queries on success', async () => {
    mocks.promotePlayer.mockResolvedValue(undefined);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const promoteWrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => usePromotePlayer(), { wrapper: promoteWrapper });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['player-profile'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-titles'] });
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

  it('invalidates the player profile and my-titles queries on success', async () => {
    mocks.demotePlayer.mockResolvedValue(undefined);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const demoteWrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useDemotePlayer(), { wrapper: demoteWrapper });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['player-profile'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-titles'] });
  });
});
