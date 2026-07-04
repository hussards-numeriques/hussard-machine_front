import { z } from 'zod';
import { GameState } from '../types';
import type { Answer, BotConfig, Game, Player, Question } from '../types';

const botConfigSchema = z.object({
  correctness_probability: z.number(),
  average_response_time: z.number(),
}) satisfies z.ZodType<BotConfig>;

const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_bot: z.boolean(),
  is_ready: z.boolean(),
  score: z.number(),
  bot_config: botConfigSchema.nullable(),
}) satisfies z.ZodType<Player>;

const questionSchema = z.object({
  id: z.string(),
  statement: z.string(),
  answer: z.number(),
  category: z.string(),
  time_limit_seconds: z.number(),
}) satisfies z.ZodType<Question>;

const answerSchema = z.object({
  player_id: z.string(),
  question_id: z.string(),
  value: z.number(),
  timestamp: z.number(),
  is_correct: z.boolean(),
  points_earned: z.number(),
}) satisfies z.ZodType<Answer>;

export const gameSchema = z.object({
  id: z.string(),
  state: z.enum(GameState),
  players: z.array(playerSchema),
  questions: z.array(questionSchema),
  current_question_index: z.number(),
  answers: z.array(answerSchema),
  start_time_current_question: z.number().optional(),
  is_quick_game: z.boolean().optional(),
}) satisfies z.ZodType<Game>;

export const serverMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('PLAYER_JOINED'),
    payload: z.object({ player_id: z.string(), game: gameSchema }),
  }),
  z.object({ type: z.literal('GAME_UPDATE'), payload: gameSchema }),
  z.object({ type: z.literal('COUNTDOWN'), payload: z.object({ seconds: z.number() }) }),
  z.object({ type: z.literal('QUESTION_COUNTDOWN'), payload: z.object({ seconds: z.number() }) }),
  z.object({ type: z.literal('ERROR'), payload: z.string() }),
]);

export type ServerMessage = z.infer<typeof serverMessageSchema>;

export const createdGameSchema = z.object({ game_id: z.string() });
