import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { myTitlesQueryKey, useMyTitles, useQuestCatalog, useSelectTitle } from './useQuests';
import type { MyTitlesResponse } from '../services/quests';

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
  const response: MyTitlesResponse = {
    level: 'CP',
    current_level: 'CP',
    selected_title_id: null,
    titles: [],
    quests: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAuthenticated = false;
  });

  it('does not fetch when the player is not authenticated', () => {
    const { result } = renderHook(() => useMyTitles(null), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mocks.fetchMyTitles).not.toHaveBeenCalled();
  });

  it('fetches the current level when level is null', async () => {
    mocks.isAuthenticated = true;
    mocks.fetchMyTitles.mockResolvedValue(response);

    const { result } = renderHook(() => useMyTitles(null), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.fetchMyTitles).toHaveBeenCalledWith(expect.any(Function), null);
  });

  it('fetches an explicit level', async () => {
    mocks.isAuthenticated = true;
    mocks.fetchMyTitles.mockResolvedValue(response);

    const { result } = renderHook(() => useMyTitles('CE1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.fetchMyTitles).toHaveBeenCalledWith(expect.any(Function), 'CE1');
  });

  it('builds query keys including the level', () => {
    expect(myTitlesQueryKey(null)).toEqual(['my-titles', 'current']);
    expect(myTitlesQueryKey('CM2')).toEqual(['my-titles', 'CM2']);
  });
});

describe('useSelectTitle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAuthenticated = true;
  });

  it('calls questsRepository.selectTitle on mutate and invalidates my-titles', async () => {
    mocks.selectTitle.mockResolvedValue({ selected_title_id: 'win-streak-bronze', level: 'CP' });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const selectTitleWrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useSelectTitle(), { wrapper: selectTitleWrapper });

    act(() => {
      result.current.mutate({ titleId: 'win-streak-bronze', level: 'CP' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.selectTitle).toHaveBeenCalledWith(expect.any(Function), 'win-streak-bronze', 'CP');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['my-titles'] });
  });
});
