import type { Game } from '../types';
import { answerResultFor, findPlayerAnswer, type AnswerResult } from './playerAnswer';

export type { AnswerResult };

export function getPlayerAnswerResults(game: Game, playerId: string): AnswerResult[] {
  return game.questions.map((question) =>
    answerResultFor(findPlayerAnswer(game, playerId, question.id))
  );
}
