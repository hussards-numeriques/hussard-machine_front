import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMyTitles, useQuestCatalog, useSelectTitle } from './useQuests';

const mocks = vi.hoisted(() => ({
  isAuthenticated: false,
  fetchCatalog: vi.fn(),
  fetchMyTitles: vi.fn(),
  selectTitle: vi.fn(),
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

vi.mock('../services/quests', () => ({
  questsRepository: {
    fetchCatalog: mocks.fetchCatalog,
    fetchMyTitles: mocks.fetchMyTitles,
    selectTitle: mocks.selectTitle,
  },
}));

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useQuestCatalog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches the catalog without requiring authentication', async () => {
    mocks.fetchCatalog.mockResolvedValue([]);

    const { result } = renderHook(() => useQuestCatalog(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.fetchCatalog).toHaveBeenCalledTimes(1);
  });
});

describe('useMyTitles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAuthenticated = false;
  });

  it('does not fetch when the player is not authenticated', () => {
    const { result } = renderHook(() => useMyTitles(), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mocks.fetchMyTitles).not.toHaveBeenCalled();
  });

  it('fetches my titles when authenticated', async () => {
    mocks.isAuthenticated = true;
    mocks.fetchMyTitles.mockResolvedValue({ selected_title_id: null, titles: [], quests: [] });

    const { result } = renderHook(() => useMyTitles(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.fetchMyTitles).toHaveBeenCalledTimes(1);
  });
});

describe('useSelectTitle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAuthenticated = true;
  });

  it('calls questsRepository.selectTitle on mutate', async () => {
    mocks.selectTitle.mockResolvedValue('win-streak-bronze');

    const { result } = renderHook(() => useSelectTitle(), { wrapper });

    act(() => {
      result.current.mutate('win-streak-bronze');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.selectTitle).toHaveBeenCalledWith(expect.any(Function), 'win-streak-bronze');
  });
});
