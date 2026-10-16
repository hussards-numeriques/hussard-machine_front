import type { Level } from './grades';
import type { PromptType } from './labels';
import type { PracticeCatalog, PracticeNotion } from '../services/practice';

export const SERIES_LENGTHS = [5, 10, 20] as const;
export type SeriesLength = (typeof SERIES_LENGTHS)[number];
export const DEFAULT_SERIES_LENGTH: SeriesLength = 10;

export interface PracticeChoice {
  level: Level;
  category: string | null;
  promptType: PromptType | null;
}

export interface PracticeOptions {
  categories: string[];
  promptTypes: PromptType[];
  category: string | null;
  notion: PracticeNotion | null;
}

export const resolvePracticeOptions = (
  catalog: PracticeCatalog,
  choice: PracticeChoice
): PracticeOptions => {
  const byCategory = catalog[choice.level] ?? {};
  const categories = Object.keys(byCategory);
  const category =
    choice.category !== null && categories.includes(choice.category) ? choice.category : null;
  const promptTypes = category === null ? [] : byCategory[category];
  const promptType =
    promptTypes.length === 1
      ? promptTypes[0]
      : (promptTypes.find((type) => type === choice.promptType) ?? null);
  return {
    categories,
    promptTypes,
    category,
    notion:
      category === null || promptType === null
        ? null
        : { level: choice.level, category, promptType },
  };
};

export type PracticeOutcome = 'correct' | 'incorrect';

export interface PracticeSeries {
  notion: PracticeNotion;
  length: SeriesLength;
  runId: number;
  outcomes: PracticeOutcome[];
  pending: { given: number; outcome: PracticeOutcome } | null;
}

export const startSeries = (
  notion: PracticeNotion,
  length: SeriesLength,
  runId: number
): PracticeSeries => ({ notion, length, runId, outcomes: [], pending: null });

export const currentQuestionIndex = (series: PracticeSeries): number => series.outcomes.length;

export const answerQuestion = (
  series: PracticeSeries,
  given: number,
  expected: number
): PracticeSeries =>
  series.pending !== null
    ? series
    : { ...series, pending: { given, outcome: given === expected ? 'correct' : 'incorrect' } };

export const nextQuestion = (series: PracticeSeries): PracticeSeries =>
  series.pending === null
    ? series
    : { ...series, outcomes: [...series.outcomes, series.pending.outcome], pending: null };

export const isSeriesFinished = (series: PracticeSeries): boolean =>
  series.outcomes.length >= series.length;

export const isLastQuestion = (series: PracticeSeries): boolean =>
  series.outcomes.length + 1 >= series.length;

export const correctCount = (series: PracticeSeries): number =>
  series.outcomes.filter((outcome) => outcome === 'correct').length;

export type PracticeRating = 'perfect' | 'great' | 'good' | 'keepGoing';

export const ratePractice = (correct: number, total: number): PracticeRating => {
  if (correct === total) return 'perfect';
  const ratio = correct / total;
  if (ratio >= 0.7) return 'great';
  if (ratio >= 0.4) return 'good';
  return 'keepGoing';
};

const CATEGORY_SYMBOLS: Record<string, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
  complement: '?',
  double: '×2',
  half: '½',
  multiplication_by_power_of_10: '×10',
  operation_priority: '( )',
  relative_number: '±',
  equation: 'x',
  fraction: '¾',
  percentage: '%',
  power: 'x²',
  square_root: '√',
  divisibility: 'r',
  function: 'f',
};

export const resolveCategorySymbol = (category: string): string =>
  CATEGORY_SYMBOLS[category] ?? '•';

const CHEERS = ['bravo', 'super', 'awesome', 'perfect', 'strong'] as const;
export type Cheer = (typeof CHEERS)[number];

export const cheerFor = (questionIndex: number): Cheer => CHEERS[questionIndex % CHEERS.length];
