import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useStreak } from './useStreak';

describe('useStreak', () => {
  it('throws when used outside a StreakProvider', () => {
    expect(() => renderHook(() => useStreak())).toThrow(
      'useStreak must be used inside <StreakProvider>'
    );
  });
});
