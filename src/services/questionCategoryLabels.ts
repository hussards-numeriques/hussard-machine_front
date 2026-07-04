import { z } from 'zod';
import { getApiUrl } from './apiConfig';

export type QuestionCategoryLabels = Record<string, string>;

const questionCategoryLabelsSchema = z.record(z.string(), z.string());

export const fetchQuestionCategoryLabels = async (): Promise<QuestionCategoryLabels> => {
  const response = await fetch(`${getApiUrl()}/question-categories/labels`);
  if (!response.ok) {
    throw new Error(`Failed to fetch category labels (${response.status})`);
  }
  return questionCategoryLabelsSchema.parse(await response.json());
};

export const resolveCategoryLabel = (
  labels: QuestionCategoryLabels | null,
  category: string
): string => {
  if (labels === null) return category;
  return labels[category] ?? category;
};
