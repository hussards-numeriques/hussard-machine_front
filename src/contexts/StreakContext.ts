import { createContext } from 'react';
import type { StreakResponse } from '../services/streak';

export interface StreakContextValue {
  streak: StreakResponse | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const StreakContext = createContext<StreakContextValue | null>(null);
