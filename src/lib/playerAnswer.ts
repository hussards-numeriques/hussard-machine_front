import type { Answer, Game } from '../types';

export type AnswerResult = 'correct' | 'incorrect' | 'timeout';

export const findPlayerAnswer = (
  game: Game,
  playerId: string | null,
  questionId: string
): Answer | null =>
  game.answers.find(
    (answer) => answer.question_id === questionId && answer.player_id === playerId
  ) ?? null;

export const answerResultFor = (answer: Answer | null): AnswerResult => {
  if (!answer) return 'timeout';
  return answer.is_correct ? 'correct' : 'incorrect';
};
