import type { Answer, Game } from '../types';

export type FeedbackStatus = 'correct' | 'wrong' | 'timeout';

export interface QuestionFeedback {
  status: FeedbackStatus;
  given: number | null;
  expected: number;
  pointsEarned: number;
}

const findPlayerAnswer = (game: Game, playerId: string, questionId: string): Answer | null =>
  game.answers.find(
    (answer) => answer.question_id === questionId && answer.player_id === playerId
  ) ?? null;

export const computeFeedback = (
  game: Game,
  playerId: string,
  questionIndex: number
): QuestionFeedback | null => {
  const question = game.questions[questionIndex];
  if (!question) return null;

  const answer = findPlayerAnswer(game, playerId, question.id);
  if (!answer) {
    return { status: 'timeout', given: null, expected: question.answer, pointsEarned: 0 };
  }

  return {
    status: answer.is_correct ? 'correct' : 'wrong',
    given: answer.value,
    expected: question.answer,
    pointsEarned: answer.points_earned,
  };
};
