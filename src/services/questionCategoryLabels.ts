const getApiUrl = (): string => {
  const url = import.meta.env.VITE_API_URL ?? '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

export type QuestionCategoryLabels = Record<string, string>;

let cachedLabelsPromise: Promise<QuestionCategoryLabels> | null = null;

export const fetchQuestionCategoryLabels = (): Promise<QuestionCategoryLabels> => {
  if (cachedLabelsPromise === null) {
    cachedLabelsPromise = fetch(`${getApiUrl()}/question-categories/labels`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch category labels (${response.status})`);
        }
        return response.json() as Promise<QuestionCategoryLabels>;
      })
      .catch((error) => {
        cachedLabelsPromise = null;
        throw error;
      });
  }
  return cachedLabelsPromise;
};

export const resolveCategoryLabel = (
  labels: QuestionCategoryLabels | null,
  category: string
): string => {
  if (labels === null) return category;
  return labels[category] ?? category;
};
