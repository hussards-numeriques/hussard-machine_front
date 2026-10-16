import { z } from 'zod';
import type { QuestionPrompt } from '../types';
import { isLevel, type Level } from '../lib/grades';
import { isPromptType, type PromptType } from '../lib/labels';
import { getApiUrl } from './apiConfig';
import { questionPromptSchema } from './gameSchemas';
import { apiErrorFrom, type AuthorizedFetch } from './http';

export type PracticeCatalog = Partial<Record<Level, Record<string, PromptType[]>>>;

export interface PracticeNotion {
  level: Level;
  category: string;
  promptType: PromptType;
}

export interface PracticeQuestion {
  prompt: QuestionPrompt;
  answer: number;
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

const practiceQuestionSchema = z.object({
  prompt: questionPromptSchema,
  answer: z.number().int(),
}) satisfies z.ZodType<PracticeQuestion>;

export const fetchPracticeCatalog = async (
  authorizedFetch: AuthorizedFetch
): Promise<PracticeCatalog> => {
  const response = await authorizedFetch(`${getApiUrl()}/practice/catalog`);
  if (!response.ok) {
    throw await apiErrorFrom(response, 'Failed to fetch practice catalog');
  }
  return practiceCatalogSchema.parse(await response.json());
};

export const fetchPracticeQuestion = async (
  authorizedFetch: AuthorizedFetch,
  { level, category, promptType }: PracticeNotion
): Promise<PracticeQuestion> => {
  const path = [level, category, promptType].map(encodeURIComponent).join('/');
  const response = await authorizedFetch(`${getApiUrl()}/practice/${path}`);
  if (!response.ok) {
    throw await apiErrorFrom(response, 'Failed to fetch practice question');
  }
  return practiceQuestionSchema.parse(await response.json());
};
