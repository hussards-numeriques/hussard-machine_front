import type { Game } from '../types';
import { answerResultFor, findPlayerAnswer, type AnswerResult } from './playerAnswer';

export type { AnswerResult };

export function getPlayerAnswerResults(game: Game, playerId: string): AnswerResult[] {
  return game.questions.map((question) =>
    answerResultFor(findPlayerAnswer(game, playerId, question.id))
  );
}

export function getAggregatedAnswerResults(
  correct: number,
  total: number,
  questionsCount: number
): AnswerResult[] {
  const clampedCorrect = Math.max(0, Math.min(correct, total));
  const correctCount = Math.max(0, Math.min(clampedCorrect, questionsCount));
  const incorrectCount = Math.max(
    0,
    Math.min(total - clampedCorrect, questionsCount - correctCount)
  );
  const timeoutCount = Math.max(0, questionsCount - correctCount - incorrectCount);

  return [
    ...Array<AnswerResult>(correctCount).fill('correct'),
    ...Array<AnswerResult>(incorrectCount).fill('incorrect'),
    ...Array<AnswerResult>(timeoutCount).fill('timeout'),
  ];
}
