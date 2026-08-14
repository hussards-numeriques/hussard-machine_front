import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useXpProgress } from './useXpProgress';
import type { PlayerProfile } from '../types';

const mocks = vi.hoisted(() => ({
  data: undefined as PlayerProfile | undefined,
  refetch: vi.fn(),
}));

vi.mock('./usePlayerProfile', () => ({
  usePlayerProfile: () => ({ data: mocks.data, refetch: mocks.refetch }),
}));

const profile = (experience: number, canPromote: boolean): PlayerProfile => ({
  username: 'Tim',
  level: 'CM1',
  experience,
  grade: 'BRONZE',
  can_promote: canPromote,
  history: [],
});

describe('useXpProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.data = profile(100, false);
    mocks.refetch = vi.fn(async () => ({ data: mocks.data }) as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null before any WAITING/COUNTDOWN snapshot has been taken', () => {
    const { result } = renderHook(() => useXpProgress('IN_PROGRESS', 'game-1'));
    expect(result.current).toBeNull();
  });

  it('snapshots the profile during WAITING and reports the settled after-state at FINISHED', async () => {
    vi.useFakeTimers();
    const { rerender, result } = renderHook(
      ({ state }: { state: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' }) =>
        useXpProgress(state, 'game-1'),
      { initialProps: { state: 'WAITING' } as { state: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' } }
    );

    await vi.waitFor(() =>
      expect(result.current?.before).toEqual({ experience: 100, canPromote: false })
    );

    rerender({ state: 'IN_PROGRESS' });

    mocks.data = profile(140, false);
    mocks.refetch = vi.fn(async () => ({ data: mocks.data }) as never);
    rerender({ state: 'FINISHED' });

    expect(result.current?.after).toBeNull();

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    await vi.waitFor(() =>
      expect(result.current?.after).toEqual({ experience: 140, canPromote: false })
    );
    expect(result.current?.before).toEqual({ experience: 100, canPromote: false });
  });

  it('reports a zero-XP after-state for a room game without treating it differently', async () => {
    vi.useFakeTimers();
    const { rerender, result } = renderHook(
      ({ state }: { state: 'WAITING' | 'FINISHED' }) => useXpProgress(state, 'game-1'),
      { initialProps: { state: 'WAITING' } as { state: 'WAITING' | 'FINISHED' } }
    );

    await vi.waitFor(() => expect(result.current?.before).not.toBeNull());

    rerender({ state: 'FINISHED' });

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    await vi.waitFor(() =>
      expect(result.current?.after).toEqual({ experience: 100, canPromote: false })
    );
  });

  it('resets the snapshot and after-state when the game id changes', async () => {
    const { rerender, result } = renderHook(
      ({ state, gameId }: { state: 'WAITING' | 'FINISHED'; gameId: string }) =>
        useXpProgress(state, gameId),
      {
        initialProps: { state: 'WAITING', gameId: 'game-1' } as {
          state: 'WAITING' | 'FINISHED';
          gameId: string;
        },
      }
    );

    await waitFor(() => expect(result.current?.before).not.toBeNull());

    rerender({ state: 'FINISHED', gameId: 'game-2' });

    expect(result.current).toBeNull();
  });
});
