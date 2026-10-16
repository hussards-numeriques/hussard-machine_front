import type { TFunction } from 'i18next';
import type { SubscriptionPlanKey } from '../services/subscription';
import { ApiError } from '../services/http';
import type { WsErrorCode } from '../services/gameSchemas';
import type { QuestionPrompt } from '../types';

export type PromptType = QuestionPrompt['type'];

const QUESTION_CATEGORIES = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
  'complement',
  'double',
  'half',
  'multiplication_by_power_of_10',
  'operation_priority',
  'relative_number',
  'equation',
  'fraction',
  'percentage',
  'power',
  'square_root',
  'divisibility',
  'function',
] as const;

const PROMPT_TYPE_FLAGS: Record<PromptType, true> = {
  addition: true,
  subtraction: true,
  multiplication_table: true,
  multiplication: true,
  difference_of_squares: true,
  division_table: true,
  division: true,
  complement: true,
  double: true,
  half: true,
  multiplication_by_power_of_10: true,
  operation_priority: true,
  relative_addition: true,
  relative_subtraction: true,
  relative_multiplication: true,
  relative_division: true,
  relative_operation_priority: true,
  missing_factor: true,
  euclidean_division: true,
  fraction_of_quantity: true,
  percentage_of_quantity: true,
  square: true,
  power: true,
  square_root: true,
  gcd: true,
  linear_equation: true,
  function_image: true,
  function_antecedent: true,
};

const QUEST_IDS = ['win-streak', 'correct-answers', 'perfect-games'] as const;

const TITLE_IDS = [
  'win-streak-bronze',
  'win-streak-silver',
  'win-streak-gold',
  'correct-answers-bronze',
  'correct-answers-silver',
  'correct-answers-gold',
  'perfect-games-bronze',
  'perfect-games-silver',
  'perfect-games-gold',
] as const;

const ICON_IDS = ['subscriber-star'] as const;

const isOneOf = <K extends string>(ids: readonly K[], value: string): value is K =>
  (ids as readonly string[]).includes(value);

export const resolveQuestionCategoryLabel = (id: string, t: TFunction): string =>
  isOneOf(QUESTION_CATEGORIES, id) ? t(`questionCategories.${id}`) : id;

export const isPromptType = (value: string): value is PromptType =>
  Object.hasOwn(PROMPT_TYPE_FLAGS, value);

export const resolvePromptTypeLabel = (type: PromptType, t: TFunction): string =>
  t(`promptTypes.${type}`);

export const resolveQuestLabel = (id: string, t: TFunction): string =>
  isOneOf(QUEST_IDS, id) ? t(`quests.labels.${id}`) : id;

export const resolveTitleLabel = (id: string, t: TFunction): string =>
  isOneOf(TITLE_IDS, id) ? t(`titles.${id}`) : id;

export const resolveIconLabel = (id: string, t: TFunction): string =>
  isOneOf(ICON_IDS, id) ? t(`icons.${id}`) : id;

export const resolvePlanLabel = (plan: SubscriptionPlanKey, t: TFunction): string =>
  t(`subscriptionPlans.${plan}`);

export const resolveWsErrorMessage = (code: WsErrorCode, t: TFunction): string =>
  t(`errors.ws.${code}`);

export const resolveApiErrorMessage = (error: unknown, fallback: string, t: TFunction): string =>
  error instanceof ApiError && error.code !== null ? t(`errors.api.${error.code}`) : fallback;
