import type { Game } from '../types';

export type AnswerResult = 'correct' | 'incorrect' | 'unanswered';

export function getPlayerAnswerResults(game: Game, playerId: string): AnswerResult[] {
  return game.questions.map((question) => {
    const answer = game.answers.find(
      (a) => a.player_id === playerId && a.question_id === question.id
    );
    if (!answer) return 'unanswered';
    return answer.is_correct ? 'correct' : 'incorrect';
  });
}
