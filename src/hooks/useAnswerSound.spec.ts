import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Answer } from '../types';

const play = vi.fn();
vi.mock('../services/sound', () => ({ soundPlayer: { play, unlock: vi.fn() } }));

const { useAnswerSound } = await import('./useAnswerSound');

const answer = (questionId: string, isCorrect: boolean): Answer => ({
  player_id: 'p1',
  question_id: questionId,
  value: 1,
  timestamp: 0,
  is_correct: isCorrect,
  points_earned: isCorrect ? 100 : 0,
});

describe('useAnswerSound', () => {
  beforeEach(() => {
    localStorage.clear();
    play.mockClear();
  });

  it('stays silent until the player has answered', () => {
    renderHook(() => useAnswerSound(null));
    expect(play).not.toHaveBeenCalled();
  });

  it('plays correct then wrong according to the answer', () => {
    const { rerender } = renderHook(({ a }) => useAnswerSound(a), {
      initialProps: { a: answer('q1', true) },
    });
    rerender({ a: answer('q2', false) });
    expect(play.mock.calls).toEqual([['correct'], ['wrong']]);
  });

  it('does not replay the sound of a question already answered', () => {
    const { rerender } = renderHook(({ a }) => useAnswerSound(a), {
      initialProps: { a: answer('q1', true) as Answer | null },
    });
    rerender({ a: null });
    rerender({ a: answer('q1', true) });
    expect(play).toHaveBeenCalledTimes(1);
  });
});
