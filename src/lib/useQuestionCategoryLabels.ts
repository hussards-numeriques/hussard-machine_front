import { useEffect, useState } from 'react';
import {
  fetchQuestionCategoryLabels,
  type QuestionCategoryLabels,
} from '../services/questionCategoryLabels';

export const useQuestionCategoryLabels = (): QuestionCategoryLabels | null => {
  const [labels, setLabels] = useState<QuestionCategoryLabels | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchQuestionCategoryLabels()
      .then((value) => {
        if (!cancelled) setLabels(value);
      })
      .catch(() => {
        if (!cancelled) setLabels(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return labels;
};
