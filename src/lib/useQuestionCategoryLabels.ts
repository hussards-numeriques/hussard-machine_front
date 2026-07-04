import { useQuery } from '@tanstack/react-query';
import {
  fetchQuestionCategoryLabels,
  type QuestionCategoryLabels,
} from '../services/questionCategoryLabels';

export const useQuestionCategoryLabels = (): QuestionCategoryLabels | null => {
  const { data } = useQuery({
    queryKey: ['question-category-labels'],
    queryFn: fetchQuestionCategoryLabels,
    staleTime: Infinity,
  });

  return data ?? null;
};
