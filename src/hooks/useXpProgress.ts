import { useEffect, useState } from 'react';
import type { GameState } from '../types';
import { usePlayerProfile } from './usePlayerProfile';

const RETRY_DELAY_MS = 1500;

export interface XpSnapshot {
  experience: number;
  canPromote: boolean;
}

export interface XpProgress {
  before: XpSnapshot;
  after: XpSnapshot | null;
  grade: string;
}

export function useXpProgress(
  gameState: GameState | null,
  gameId: string | undefined
): XpProgress | null {
  const { data, refetch } = usePlayerProfile();
  const [snapshot, setSnapshot] = useState<XpSnapshot | null>(null);
  const [prevGameId, setPrevGameId] = useState(gameId);
  const [after, setAfter] = useState<XpSnapshot | null>(null);

  if (gameId !== prevGameId) {
    setPrevGameId(gameId);
    setSnapshot(null);
    setAfter(null);
  } else if (
    (gameState === 'WAITING' || gameState === 'COUNTDOWN') &&
    data &&
    (snapshot === null ||
      snapshot.experience !== data.experience ||
      snapshot.canPromote !== data.can_promote)
  ) {
    setSnapshot({ experience: data.experience, canPromote: data.can_promote });
  }

  useEffect(() => {
    if (gameState !== 'FINISHED' || snapshot === null) {
      return;
    }
    let cancelled = false;

    const settle = async () => {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      const result = await refetch();
      if (!cancelled && result.data) {
        setAfter({ experience: result.data.experience, canPromote: result.data.can_promote });
      }
    };

    void settle();

    return () => {
      cancelled = true;
    };
  }, [gameState, refetch, snapshot]);

  if (snapshot === null) {
    return null;
  }

  return { before: snapshot, after, grade: data?.grade ?? '' };
}
