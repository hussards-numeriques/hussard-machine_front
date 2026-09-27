import React, { useCallback, useEffect, useMemo, useState } from 'react';
import posthog from 'posthog-js';
import { GameClient } from '../services/GameClient';
import { GameState, type Game } from '../types';
import { GameContext, type GameContextValue } from './GameContext';
import { useStreak } from './useStreak';

const captureGameEvent = (game: Game, playerId: string | null) => {
  const mode = game.is_quick_game ? 'quick' : 'lobby';
  if (game.state === GameState.IN_PROGRESS) {
    posthog.capture('game_started', {
      mode,
      level: game.level,
      players: game.players.length,
    });
  }
  if (game.state === GameState.FINISHED) {
    const ranking = [...game.players].sort((a, b) => b.score - a.score);
    const rank = ranking.findIndex((p) => p.id === playerId);
    posthog.capture('game_finished', {
      mode,
      level: game.level,
      players: game.players.length,
      questions: game.questions.length,
      score: ranking[rank]?.score,
      rank: rank >= 0 ? rank + 1 : undefined,
    });
  }
};

const createGameTransitionTracker = () => {
  let lastTracked = '';
  return (game: Game, playerId: string | null) => {
    const key = `${game.id}:${game.state}`;
    if (key === lastTracked) {
      return;
    }
    lastTracked = key;
    captureGameEvent(game, playerId);
  };
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);

  const client = useMemo(() => {
    const trackGameTransition = createGameTransitionTracker();
    const gameClient = new GameClient(
      (newGame) => {
        trackGameTransition(newGame, gameClient.getPlayerId());
        setGame(newGame);
      },
      (err) => setError(err)
    );
    return gameClient;
  }, []);

  // Re-read the streak after a game so StreakProvider can emit streak_maintained.
  const { refresh: refreshStreak } = useStreak();
  const finished = game?.state === GameState.FINISHED;
  useEffect(() => {
    if (finished) void refreshStreak();
  }, [finished, refreshStreak]);

  const clearError = useCallback(() => setError(null), []);
  const resetGame = useCallback(() => {
    setGame(null);
    setError(null);
  }, []);

  const value: GameContextValue = { client, game, error, clearError, resetGame };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
