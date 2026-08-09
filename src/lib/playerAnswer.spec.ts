import { describe, expect, it } from 'vitest';
import { answerResultFor, findPlayerAnswer } from './playerAnswer';
import type { Game } from '../types';
import { GameState } from '../types';

function buildGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 'G1',
    state: GameState.IN_PROGRESS,
    players: [],
    questions: [
      { id: 'q1', statement: '1+1', answer: 2, category: 'addition', time_limit_seconds: 10 },
    ],
    current_question_index: 0,
    answers: [],
    start_time_current_question: null,
    ...overrides,
  };
}

describe('findPlayerAnswer', () => {
  it('finds the answer matching both the player and the question', () => {
    const game = buildGame({
      answers: [
        {
          player_id: 'p1',
          question_id: 'q1',
          value: 2,
          timestamp: 1,
          is_correct: true,
          points_earned: 10,
        },
      ],
    });

    expect(findPlayerAnswer(game, 'p1', 'q1')).toEqual(game.answers[0]);
  });

  it('returns null when no answer matches', () => {
    const game = buildGame();

    expect(findPlayerAnswer(game, 'p1', 'q1')).toBeNull();
  });

  it('returns null when playerId is null', () => {
    const game = buildGame({
      answers: [
        {
          player_id: 'p1',
          question_id: 'q1',
          value: 2,
          timestamp: 1,
          is_correct: true,
          points_earned: 10,
        },
      ],
    });

    expect(findPlayerAnswer(game, null, 'q1')).toBeNull();
  });
});

describe('answerResultFor', () => {
  it('returns timeout when there is no answer', () => {
    expect(answerResultFor(null)).toBe('timeout');
  });

  it('returns correct when the answer is correct', () => {
    expect(
      answerResultFor({
        player_id: 'p1',
        question_id: 'q1',
        value: 2,
        timestamp: 1,
        is_correct: true,
        points_earned: 10,
      })
    ).toBe('correct');
  });

  it('returns incorrect when the answer is wrong', () => {
    expect(
      answerResultFor({
        player_id: 'p1',
        question_id: 'q1',
        value: 3,
        timestamp: 1,
        is_correct: false,
        points_earned: 0,
      })
    ).toBe('incorrect');
  });
});
