import type { Game } from '../types';
import { answerResultFor, findPlayerAnswer, type AnswerResult } from './playerAnswer';

export interface QuestionFeedback {
  status: AnswerResult;
  given: number | null;
  expected: number;
  pointsEarned: number;
}

export const computeFeedback = (
  game: Game,
  playerId: string,
  questionIndex: number
): QuestionFeedback | null => {
  const question = game.questions[questionIndex];
  if (!question) return null;

  const answer = findPlayerAnswer(game, playerId, question.id);

  return {
    status: answerResultFor(answer),
    given: answer?.value ?? null,
    expected: question.answer,
    pointsEarned: answer?.points_earned ?? 0,
  };
};
