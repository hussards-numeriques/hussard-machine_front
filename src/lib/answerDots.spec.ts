import { describe, expect, it } from 'vitest';
import { getAggregatedAnswerResults, getPlayerAnswerResults } from './answerDots';
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

describe('getAggregatedAnswerResults', () => {
  it('splits into correct, then incorrect, then timeout, in that order', () => {
    expect(getAggregatedAnswerResults(3, 4, 5)).toEqual([
      'correct',
      'correct',
      'correct',
      'incorrect',
      'timeout',
    ]);
  });

  it('returns only correct when every question was answered correctly', () => {
    expect(getAggregatedAnswerResults(5, 5, 5)).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);
  });

  it('returns only timeout when nothing was answered', () => {
    expect(getAggregatedAnswerResults(0, 0, 3)).toEqual(['timeout', 'timeout', 'timeout']);
  });

  it('clamps total above questionsCount instead of over-producing results', () => {
    expect(getAggregatedAnswerResults(2, 6, 5)).toEqual([
      'correct',
      'correct',
      'incorrect',
      'incorrect',
      'incorrect',
    ]);
  });

  it('clamps correct above total instead of producing negative counts', () => {
    expect(getAggregatedAnswerResults(4, 2, 5)).toEqual([
      'correct',
      'correct',
      'timeout',
      'timeout',
      'timeout',
    ]);
  });

  it('returns an empty array when questionsCount is 0', () => {
    expect(getAggregatedAnswerResults(0, 0, 0)).toEqual([]);
  });
});
