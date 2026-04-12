import { createContext } from 'react';
import type { GameClient } from '../services/GameClient';
import type { Game } from '../types';

export interface GameContextValue {
  client: GameClient;
  game: Game | null;
  error: string | null;
  clearError: () => void;
  resetGame: () => void;
}

export const GameContext = createContext<GameContextValue | null>(null);
