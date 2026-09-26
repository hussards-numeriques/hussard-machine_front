import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../types';
import type { Level } from '../lib/grades';
import type { MyTitle } from '../services/quests';
import { useMyTitles } from './useQuests';

export const RETRY_DELAY_MS = 1500;

export function useTitleUnlocks(
  gameState: GameState | null,
  gameId: string | undefined,
  gameLevel: Level | undefined
): MyTitle[] {
  const { data, refetch } = useMyTitles(gameLevel ?? null);
  const snapshotRef = useRef<Set<string> | null>(null);
  const [prevGameId, setPrevGameId] = useState(gameId);
  const [newTitles, setNewTitles] = useState<MyTitle[]>([]);

  if (gameId !== prevGameId) {
    setPrevGameId(gameId);
    setNewTitles([]);
  }

  useEffect(() => {
    snapshotRef.current = null;
  }, [gameId, gameLevel]);

  useEffect(() => {
    if (
      (gameState === 'WAITING' || gameState === 'COUNTDOWN') &&
      data &&
      gameLevel !== undefined &&
      data.level === gameLevel
    ) {
      snapshotRef.current = new Set(data.titles.map((t) => t.id));
    }
  }, [gameState, data, gameLevel]);

  useEffect(() => {
    if (gameState !== 'FINISHED' || snapshotRef.current === null) {
      return;
    }
    const knownIds = snapshotRef.current;
    let cancelled = false;

    const diffNew = (titles: MyTitle[]) => titles.filter((t) => !knownIds.has(t.id));

    const detect = async () => {
      const first = await refetch();
      const firstNew = diffNew(first.data?.titles ?? []);
      if (cancelled) return;
      if (firstNew.length > 0) {
        setNewTitles(firstNew);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      if (cancelled) return;
      const second = await refetch();
      const secondNew = diffNew(second.data?.titles ?? []);
      if (!cancelled) {
        setNewTitles(secondNew);
      }
    };

    void detect();

    return () => {
      cancelled = true;
    };
  }, [gameState, refetch]);

  return newTitles;
}
