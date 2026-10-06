import type { TFunction } from 'i18next';
import type { SubscriptionPlanKey } from '../services/subscription';
import { ApiError } from '../services/http';
import type { WsErrorCode } from '../services/gameSchemas';

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
