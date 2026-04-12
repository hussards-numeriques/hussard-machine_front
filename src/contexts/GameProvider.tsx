import React, { useCallback, useMemo, useState } from 'react';
import { GameClient } from '../services/GameClient';
import type { Game } from '../types';
import { GameContext, type GameContextValue } from './GameContext';

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);

  const client = useMemo(
    () =>
      new GameClient(
        (newGame) => setGame(newGame),
        (err) => setError(err)
      ),
    []
  );

  const clearError = useCallback(() => setError(null), []);
  const resetGame = useCallback(() => {
    setGame(null);
    setError(null);
  }, []);

  const value: GameContextValue = { client, game, error, clearError, resetGame };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
