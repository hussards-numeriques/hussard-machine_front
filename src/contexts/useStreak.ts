import { useContext } from 'react';
import { StreakContext, type StreakContextValue } from './StreakContext';

export const useStreak = (): StreakContextValue => {
  const ctx = useContext(StreakContext);
  if (!ctx) {
    throw new Error('useStreak must be used inside <StreakProvider>');
  }
  return ctx;
};
