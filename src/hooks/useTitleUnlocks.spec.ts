import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RETRY_DELAY_MS, useTitleUnlocks } from './useTitleUnlocks';
import type { MyTitle, MyTitlesResponse } from '../services/quests';

const mocks = vi.hoisted(() => ({
  data: undefined as MyTitlesResponse | undefined,
  refetch: vi.fn(),
  requestedLevel: undefined as string | null | undefined,
}));

vi.mock('./useQuests', () => ({
  useMyTitles: (level: string | null) => {
    mocks.requestedLevel = level;
    return { data: mocks.data, refetch: mocks.refetch };
  },
}));

const titleA: MyTitle = {
  id: 'a',
  rarity: 'BRONZE',
  unlocked_at: '2026-07-01T00:00:00',
};
const titleB: MyTitle = {
  id: 'b',
  rarity: 'SILVER',
  unlocked_at: '2026-07-12T00:00:00',
};

const response = (
  titles: MyTitle[],
  level: MyTitlesResponse['level'] = 'CP'
): MyTitlesResponse => ({
  level,
  current_level: 'CP',
  selected_title_id: null,
  titles,
  quests: [],
});

describe('useTitleUnlocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.data = response([titleA]);
    mocks.refetch = vi.fn(async () => ({ data: mocks.data }) as never);
    mocks.requestedLevel = undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns an empty array before the game finishes', () => {
    const { result } = renderHook(() => useTitleUnlocks('WAITING', 'game-1', 'CP'));
    expect(result.current).toEqual([]);
  });

  it('requests titles for the game level', () => {
    renderHook(() => useTitleUnlocks('WAITING', 'game-1', 'CM2'));
    expect(mocks.requestedLevel).toBe('CM2');
  });

  it('detects a title unlocked between the lobby snapshot and the podium', async () => {
    const { rerender, result } = renderHook(
      ({ state }: { state: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' }) =>
        useTitleUnlocks(state, 'game-1', 'CP'),
      {
        initialProps: { state: 'WAITING' } as {
          state: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
        },
      }
    );

    rerender({ state: 'IN_PROGRESS' });

    expect(mocks.refetch).not.toHaveBeenCalled();

    mocks.data = response([titleA, titleB]);
    mocks.refetch = vi.fn(async () => ({ data: mocks.data }) as never);
    rerender({ state: 'FINISHED' });

    await waitFor(() => expect(result.current).toEqual([titleB]));
  });

  it('retries once after the retry delay when nothing new is found immediately', async () => {
    vi.useFakeTimers();
    mocks.refetch = vi
      .fn()
      .mockResolvedValueOnce({ data: response([titleA]) })
      .mockResolvedValueOnce({ data: response([titleA, titleB]) });

    const { rerender, result } = renderHook(
      ({ state }: { state: 'WAITING' | 'FINISHED' }) => useTitleUnlocks(state, 'game-1', 'CP'),
      { initialProps: { state: 'WAITING' } as { state: 'WAITING' | 'FINISHED' } }
    );

    rerender({ state: 'FINISHED' });
    await vi.waitFor(() => expect(mocks.refetch).toHaveBeenCalledTimes(1));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);
    });

    expect(mocks.refetch).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual([titleB]);
    vi.useRealTimers();
  });

  it('resets the snapshot and result when the game id changes', async () => {
    const { rerender, result } = renderHook(
      ({ state, gameId }: { state: 'WAITING' | 'IN_PROGRESS' | 'FINISHED'; gameId: string }) =>
        useTitleUnlocks(state, gameId, 'CP'),
      {
        initialProps: { state: 'WAITING', gameId: 'game-1' } as {
          state: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
          gameId: string;
        },
      }
    );

    rerender({ state: 'FINISHED', gameId: 'game-1' });
    await waitFor(() => expect(result.current).toEqual([]));

    mocks.data = response([titleA, titleB]);
    mocks.refetch = vi.fn(async () => ({ data: mocks.data }) as never);

    rerender({ state: 'FINISHED', gameId: 'game-2' });

    expect(mocks.refetch).not.toHaveBeenCalled();
    expect(result.current).toEqual([]);
  });

  it('never calls refetch and returns no titles when the game level is undefined', async () => {
    const { rerender, result } = renderHook(
      ({ state }: { state: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' }) =>
        useTitleUnlocks(state, 'game-1', undefined),
      {
        initialProps: { state: 'WAITING' } as {
          state: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
        },
      }
    );

    rerender({ state: 'IN_PROGRESS' });
    rerender({ state: 'FINISHED' });

    expect(mocks.refetch).not.toHaveBeenCalled();
    expect(result.current).toEqual([]);
  });

  it('ignores the snapshot when the fetched data level does not match the game level', async () => {
    mocks.data = response([titleA], 'CP');

    const { rerender, result } = renderHook(
      ({ state }: { state: 'WAITING' | 'FINISHED' }) => useTitleUnlocks(state, 'game-1', 'CE1'),
      { initialProps: { state: 'WAITING' } as { state: 'WAITING' | 'FINISHED' } }
    );

    rerender({ state: 'FINISHED' });

    expect(mocks.refetch).not.toHaveBeenCalled();
    expect(result.current).toEqual([]);
  });
});
