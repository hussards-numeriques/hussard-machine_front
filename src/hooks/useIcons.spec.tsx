import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useIconCatalog, useMyIcons, useSelectIcon } from './useIcons';

const mocks = vi.hoisted(() => ({
  isAuthenticated: false,
  fetchCatalog: vi.fn(),
  fetchMyIcons: vi.fn(),
  selectIcon: vi.fn(),
}));

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    client: { authorizedFetch: vi.fn() },
    user: null,
    isAuthenticated: mocks.isAuthenticated,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    reloadUser: vi.fn(),
  }),
}));

vi.mock('../services/icons', () => ({
  iconsRepository: {
    fetchCatalog: mocks.fetchCatalog,
    fetchMyIcons: mocks.fetchMyIcons,
    selectIcon: mocks.selectIcon,
  },
}));

describe('useIconCatalog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches the catalog without requiring authentication', async () => {
    mocks.fetchCatalog.mockResolvedValue([]);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useIconCatalog(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.fetchCatalog).toHaveBeenCalledTimes(1);
  });
});

describe('useMyIcons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAuthenticated = false;
  });

  it('does not fetch when the player is not authenticated', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useMyIcons(), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mocks.fetchMyIcons).not.toHaveBeenCalled();
  });

  it('fetches my icons when authenticated', async () => {
    mocks.isAuthenticated = true;
    mocks.fetchMyIcons.mockResolvedValue({ selected_icon_id: null, icons: [] });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useMyIcons(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.fetchMyIcons).toHaveBeenCalledTimes(1);
  });
});

describe('useSelectIcon', () => {
  let queryClient: QueryClient;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAuthenticated = true;
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it('calls iconsRepository.selectIcon on mutate', async () => {
    mocks.selectIcon.mockResolvedValue('subscriber-star');

    const { result } = renderHook(() => useSelectIcon(), { wrapper });

    act(() => {
      result.current.mutate('subscriber-star');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.selectIcon).toHaveBeenCalledWith(expect.any(Function), 'subscriber-star');
  });

  it('invalidates both my-icons and player-profile queries on success', async () => {
    mocks.selectIcon.mockResolvedValue('subscriber-star');
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSelectIcon(), { wrapper });

    act(() => {
      result.current.mutate('subscriber-star');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-icons'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['player-profile'] });
  });
});
