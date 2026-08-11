import { describe, expect, it } from 'vitest';
import { getPlayerAnswerResults } from './answerDots';
import type { Game } from '../types';
import { GameState } from '../types';

function buildGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 'G1',
    state: GameState.FINISHED,
    players: [],
    questions: [
      { id: 'q1', statement: '1+1', answer: 2, category: 'addition', time_limit_seconds: 10 },
      { id: 'q2', statement: '2+2', answer: 4, category: 'addition', time_limit_seconds: 10 },
      { id: 'q3', statement: '3+3', answer: 6, category: 'addition', time_limit_seconds: 10 },
    ],
    current_question_index: 3,
    answers: [],
    start_time_current_question: null,
    host_player_id: null,
    max_players: 6,
    ...overrides,
  };
}

describe('getPlayerAnswerResults', () => {
  it('orders results by game.questions order, not by the answers array order', () => {
    const game = buildGame({
      answers: [
        {
          player_id: 'p1',
          question_id: 'q3',
          value: 6,
          timestamp: 3,
          is_correct: true,
          points_earned: 10,
        },
        {
          player_id: 'p1',
          question_id: 'q1',
          value: 2,
          timestamp: 1,
          is_correct: true,
          points_earned: 10,
        },
        {
          player_id: 'p1',
          question_id: 'q2',
          value: 5,
          timestamp: 2,
          is_correct: false,
          points_earned: 0,
        },
      ],
    });

    expect(getPlayerAnswerResults(game, 'p1')).toEqual(['correct', 'incorrect', 'correct']);
  });

  it('marks timeout when the player has no answer for a question', () => {
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

    expect(getPlayerAnswerResults(game, 'p1')).toEqual(['correct', 'timeout', 'timeout']);
  });

  it('ignores other players answers', () => {
    const game = buildGame({
      answers: [
        {
          player_id: 'p2',
          question_id: 'q1',
          value: 2,
          timestamp: 1,
          is_correct: true,
          points_earned: 10,
        },
      ],
    });

    expect(getPlayerAnswerResults(game, 'p1')).toEqual(['timeout', 'timeout', 'timeout']);
  });

  it('returns an empty array when the game has no questions', () => {
    const game = buildGame({ questions: [] });

    expect(getPlayerAnswerResults(game, 'p1')).toEqual([]);
  });
});
