import { z } from 'zod';
import { GameState } from '../types';
import type {
  Answer,
  BotConfig,
  ExpressionNode,
  Game,
  Player,
  PlayerTitle,
  Question,
  QuestionPrompt,
} from '../types';
import { LEVELS } from '../lib/grades';

const botConfigSchema = z.object({
  correctness_probability: z.number(),
  average_response_time: z.number(),
}) satisfies z.ZodType<BotConfig>;

const titleSchema = z.object({
  id: z.string(),
  rarity: z.string(),
}) satisfies z.ZodType<PlayerTitle>;

const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_bot: z.boolean(),
  is_ready: z.boolean(),
  is_connected: z.boolean(),
  score: z.number(),
  level: z.string(),
  grade: z.string(),
  daily_streak: z.number(),
  title: titleSchema.nullable(),
  bot_config: botConfigSchema.nullable(),
}) satisfies z.ZodType<Player>;

const integer = z.number().int();

const expressionNodeSchema: z.ZodType<ExpressionNode> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('number'), value: integer }),
    z.object({
      kind: z.literal('operation'),
      operator: z.enum(['add', 'subtract', 'multiply', 'divide']),
      left: expressionNodeSchema,
      right: expressionNodeSchema,
    }),
  ])
);

const affineSchema = z.object({ coefficient: integer, constant: integer });

const questionPromptSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('addition'), left: integer, right: integer }),
  z.object({ type: z.literal('subtraction'), left: integer, right: integer }),
  z.object({ type: z.literal('multiplication_table'), table: integer, factor: integer }),
  z.object({ type: z.literal('multiplication'), left: integer, right: integer }),
  z.object({ type: z.literal('difference_of_squares'), center: integer, offset: integer }),
  z.object({ type: z.literal('division_table'), dividend: integer, divisor: integer }),
  z.object({ type: z.literal('division'), dividend: integer, divisor: integer }),
  z.object({ type: z.literal('complement'), value: integer, target: integer }),
  z.object({ type: z.literal('double'), value: integer }),
  z.object({ type: z.literal('half'), value: integer }),
  z.object({
    type: z.literal('multiplication_by_power_of_10'),
    factor: integer,
    exponent: integer,
  }),
  z.object({ type: z.literal('operation_priority'), expression: expressionNodeSchema }),
  z.object({ type: z.literal('relative_addition'), left: integer, right: integer }),
  z.object({ type: z.literal('relative_subtraction'), left: integer, right: integer }),
  z.object({ type: z.literal('relative_multiplication'), left: integer, right: integer }),
  z.object({ type: z.literal('relative_division'), dividend: integer, divisor: integer }),
  z.object({ type: z.literal('relative_operation_priority'), expression: expressionNodeSchema }),
  z.object({ type: z.literal('missing_factor'), factor: integer, product: integer }),
  z.object({
    type: z.literal('euclidean_division'),
    dividend: integer,
    divisor: integer,
    asked: z.enum(['quotient', 'remainder']),
  }),
  z.object({
    type: z.literal('fraction_of_quantity'),
    numerator: integer,
    denominator: integer,
    quantity: integer,
  }),
  z.object({ type: z.literal('percentage_of_quantity'), rate: integer, quantity: integer }),
  z.object({ type: z.literal('square'), base: integer }),
  z.object({ type: z.literal('power'), base: integer, exponent: integer }),
  z.object({ type: z.literal('square_root'), radicand: integer }),
  z.object({ type: z.literal('gcd'), left: integer, right: integer }),
  z.object({ type: z.literal('linear_equation'), left: affineSchema, right: affineSchema }),
  z.object({ type: z.literal('function_image'), function: affineSchema, x: integer }),
  z.object({ type: z.literal('function_antecedent'), function: affineSchema, image: integer }),
]) satisfies z.ZodType<QuestionPrompt>;

const questionSchema = z.object({
  id: z.string(),
  prompt: questionPromptSchema,
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
  start_time_current_question: z.number().nullable(),
  is_quick_game: z.boolean().optional(),
  host_player_id: z.string().nullable(),
  max_players: z.number(),
  level: z.enum(LEVELS).optional().catch(undefined),
}) satisfies z.ZodType<Game>;

const WS_ERROR_CODES = ['JOIN_FAILED', 'ADD_BOT_FAILED', 'REMOVE_PLAYER_FAILED'] as const;
export type WsErrorCode = (typeof WS_ERROR_CODES)[number];

export const serverMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('PLAYER_JOINED'),
    payload: z.object({ player_id: z.string(), game: gameSchema }),
  }),
  z.object({ type: z.literal('GAME_UPDATE'), payload: gameSchema }),
  z.object({ type: z.literal('COUNTDOWN'), payload: z.object({ seconds: z.number() }) }),
  z.object({ type: z.literal('QUESTION_COUNTDOWN'), payload: z.object({ seconds: z.number() }) }),
  z.object({ type: z.literal('ERROR'), payload: z.enum(WS_ERROR_CODES) }),
  z.object({ type: z.literal('KICKED'), payload: z.object({}) }),
  z.object({ type: z.literal('LOBBY_CLOSED'), payload: z.object({}) }),
]);

export type ServerMessage = z.infer<typeof serverMessageSchema>;

export const createdGameSchema = z.object({ game_id: z.string() });
