import { z } from 'zod';
import type { QuestionPrompt } from '../types';
import { isLevel, type Level } from '../lib/grades';
import { isPromptType, type PromptType } from '../lib/labels';
import { getApiUrl } from './apiConfig';
import { questionPromptSchema } from './gameSchemas';
import type { PlayerIcon } from './icons';
import { apiErrorFrom, type AuthorizedFetch } from './http';

export type PracticeCatalog = Partial<Record<Level, Record<string, PromptType[]>>>;

export interface PracticeNotion {
  level: Level;
  category: string;
  promptType: PromptType;
}

export type PracticeTopic =
  | ({ kind: 'notion' } & PracticeNotion)
  | { kind: 'timesTables'; tables: number[] };

export interface PracticeQuestion {
  prompt: QuestionPrompt;
  answer: number;
  unlockedIcon?: PlayerIcon;
}

type RawCatalog = Record<string, Record<string, string[]>>;

const knownPromptTypes = (categories: Record<string, string[]>): Record<string, PromptType[]> =>
  Object.fromEntries(
    Object.entries(categories)
      .map(([category, types]) => [category, types.filter(isPromptType)] as const)
      .filter(([, types]) => types.length > 0)
  );

export const toPracticeCatalog = (raw: RawCatalog): PracticeCatalog =>
  Object.fromEntries(
    Object.entries(raw)
      .filter(([level]) => isLevel(level))
      .map(([level, categories]) => [level, knownPromptTypes(categories)])
  );

const practiceCatalogSchema = z
  .record(z.string(), z.record(z.string(), z.array(z.string())))
  .transform(toPracticeCatalog);

const unlockedIconSchema = z.object({
  id: z.string(),
  rarity: z.string(),
  url: z.string(),
});

const practiceQuestionSchema = z
  .object({
    prompt: questionPromptSchema,
    answer: z.number().int(),
    unlocked_icon: unlockedIconSchema.nullish(),
  })
  .transform(
    ({ prompt, answer, unlocked_icon }): PracticeQuestion => ({
      prompt,
      answer,
      unlockedIcon: unlocked_icon ?? undefined,
    })
  );

export const fetchPracticeCatalog = async (
  authorizedFetch: AuthorizedFetch
): Promise<PracticeCatalog> => {
  const response = await authorizedFetch(`${getApiUrl()}/practice/catalog`);
  if (!response.ok) {
    throw await apiErrorFrom(response, 'Failed to fetch practice catalog');
  }
  return practiceCatalogSchema.parse(await response.json());
};

const practiceTimesTablesSchema = z
  .object({ tables: z.array(z.number().int()) })
  .transform(({ tables }) => tables);

export const fetchPracticeTimesTables = async (
  authorizedFetch: AuthorizedFetch
): Promise<number[]> => {
  const response = await authorizedFetch(`${getApiUrl()}/practice/times-tables`);
  if (!response.ok) {
    throw await apiErrorFrom(response, 'Failed to fetch practice times tables');
  }
  return practiceTimesTablesSchema.parse(await response.json());
};

const questionPath = (topic: PracticeTopic): string => {
  if (topic.kind === 'notion') {
    const path = [topic.level, topic.category, topic.promptType].map(encodeURIComponent).join('/');
    return `/practice/${path}`;
  }
  const query = new URLSearchParams(topic.tables.map((table) => ['tables', String(table)]));
  return `/practice/times-tables/question?${query.toString()}`;
};

export const fetchPracticeQuestion = async (
  authorizedFetch: AuthorizedFetch,
  topic: PracticeTopic
): Promise<PracticeQuestion> => {
  const response = await authorizedFetch(`${getApiUrl()}${questionPath(topic)}`);
  if (!response.ok) {
    throw await apiErrorFrom(response, 'Failed to fetch practice question');
  }
  return practiceQuestionSchema.parse(await response.json());
};
