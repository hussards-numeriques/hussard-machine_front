import { describe, it, expect } from 'vitest';
import { computeFeedback, computeCombo } from './feedback';
import type { Game } from '../types';

const baseGame = (): Game => ({
  id: 'G1',
  state: 'IN_PROGRESS',
  players: [],
  questions: [
    { id: 'q1', statement: '2 + 2', answer: 4, category: 'addition', time_limit_seconds: 10 },
    { id: 'q2', statement: '3 + 3', answer: 6, category: 'addition', time_limit_seconds: 10 },
    {
      id: 'q3',
      statement: '7 x 8',
      answer: 56,
      category: 'multiplication',
      time_limit_seconds: 10,
    },
  ],
  current_question_index: 2,
  answers: [],
});

describe('computeFeedback', () => {
  it('returns correct status with given value and points when the answer is right', () => {
    // Given
    const game = baseGame();
    game.answers = [
      {
        player_id: 'p1',
        question_id: 'q1',
        value: 4,
        timestamp: 0,
        is_correct: true,
        points_earned: 135,
      },
    ];

    // When
    const feedback = computeFeedback(game, 'p1', 0);

    // Then
    expect(feedback).toEqual({ status: 'correct', given: 4, expected: 4, pointsEarned: 135 });
  });

  it('returns wrong status with the given value and the expected answer', () => {
    // Given
    const game = baseGame();
    game.answers = [
      {
        player_id: 'p1',
        question_id: 'q1',
        value: 5,
        timestamp: 0,
        is_correct: false,
        points_earned: 0,
      },
    ];

    // When
    const feedback = computeFeedback(game, 'p1', 0);

    // Then
    expect(feedback).toEqual({ status: 'wrong', given: 5, expected: 4, pointsEarned: 0 });
  });

  it('returns timeout status when the player did not answer', () => {
    // Given
    const game = baseGame();

    // When
    const feedback = computeFeedback(game, 'p1', 0);

    // Then
    expect(feedback).toEqual({ status: 'timeout', given: null, expected: 4, pointsEarned: 0 });
  });

  it('returns null for an out-of-range index', () => {
    // Given
    const game = baseGame();

    // When / Then
    expect(computeFeedback(game, 'p1', 9)).toBeNull();
  });
});

describe('computeCombo', () => {
  it('counts consecutive correct answers ending at the given index', () => {
    // Given
    const game = baseGame();
    game.answers = [
      {
        player_id: 'p1',
        question_id: 'q1',
        value: 4,
        timestamp: 0,
        is_correct: true,
        points_earned: 100,
      },
      {
        player_id: 'p1',
        question_id: 'q2',
        value: 6,
        timestamp: 0,
        is_correct: true,
        points_earned: 100,
      },
      {
        player_id: 'p1',
        question_id: 'q3',
        value: 56,
        timestamp: 0,
        is_correct: true,
        points_earned: 100,
      },
    ];

    // When / Then
    expect(computeCombo(game, 'p1', 2)).toBe(3);
  });

  it('resets the combo on a wrong answer', () => {
    // Given
    const game = baseGame();
    game.answers = [
      {
        player_id: 'p1',
        question_id: 'q1',
        value: 4,
        timestamp: 0,
        is_correct: true,
        points_earned: 100,
      },
      {
        player_id: 'p1',
        question_id: 'q2',
        value: 9,
        timestamp: 0,
        is_correct: false,
        points_earned: 0,
      },
      {
        player_id: 'p1',
        question_id: 'q3',
        value: 56,
        timestamp: 0,
        is_correct: true,
        points_earned: 100,
      },
    ];

    // When / Then
    expect(computeCombo(game, 'p1', 2)).toBe(1);
  });

  it('resets the combo on a missing (timed out) answer', () => {
    // Given
    const game = baseGame();
    game.answers = [
      {
        player_id: 'p1',
        question_id: 'q1',
        value: 4,
        timestamp: 0,
        is_correct: true,
        points_earned: 100,
      },
      {
        player_id: 'p1',
        question_id: 'q3',
        value: 56,
        timestamp: 0,
        is_correct: true,
        points_earned: 100,
      },
    ];

    // When / Then
    expect(computeCombo(game, 'p1', 2)).toBe(1);
  });
});
