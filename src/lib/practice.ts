import type { Level } from './grades';
import type { PromptType } from './labels';
import type { PracticeCatalog, PracticeNotion, PracticeTopic } from '../services/practice';

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

export interface TimeLimitSetting {
  enabled: boolean;
  seconds: number;
}

export const HANDWRITING_COMFORTABLE_SECONDS = 5;

export const TIME_LIMIT_MIN_SECONDS = 2;
export const TIME_LIMIT_MAX_SECONDS = 99;
export const DEFAULT_TIME_LIMIT_SECONDS = 10;

export const DEFAULT_TIME_LIMIT_SETTING: TimeLimitSetting = {
  enabled: false,
  seconds: DEFAULT_TIME_LIMIT_SECONDS,
};

export const resolveTimeLimitSeconds = ({ enabled, seconds }: TimeLimitSetting): number | null =>
  enabled ? seconds : null;

export const clampTimeLimit = (value: number): number =>
  Number.isNaN(value)
    ? DEFAULT_TIME_LIMIT_SECONDS
    : Math.min(TIME_LIMIT_MAX_SECONDS, Math.max(TIME_LIMIT_MIN_SECONDS, Math.round(value)));

export const isWithinTimeLimitRange = (value: number): boolean =>
  value >= TIME_LIMIT_MIN_SECONDS && value <= TIME_LIMIT_MAX_SECONDS;

export const toggleTable = (tables: number[], table: number): number[] =>
  (tables.includes(table) ? tables.filter((t) => t !== table) : [...tables, table]).sort(
    (a, b) => a - b
  );

export type PendingAnswer =
  | { kind: 'answered'; given: number; outcome: PracticeOutcome }
  | { kind: 'timedOut' };

export interface PracticeSeries {
  topic: PracticeTopic;
  length: SeriesLength;
  runId: number;
  timeLimitSeconds: number | null;
  outcomes: PracticeOutcome[];
  pending: PendingAnswer | null;
}

export const startSeries = (
  topic: PracticeTopic,
  length: SeriesLength,
  runId: number,
  timeLimitSeconds: number | null
): PracticeSeries => ({ topic, length, runId, timeLimitSeconds, outcomes: [], pending: null });

export const currentQuestionIndex = (series: PracticeSeries): number => series.outcomes.length;

export const answerQuestion = (
  series: PracticeSeries,
  given: number,
  expected: number
): PracticeSeries =>
  series.pending !== null
    ? series
    : {
        ...series,
        pending: {
          kind: 'answered',
          given,
          outcome: given === expected ? 'correct' : 'incorrect',
        },
      };

export const timeOutQuestion = (series: PracticeSeries): PracticeSeries =>
  series.pending !== null ? series : { ...series, pending: { kind: 'timedOut' } };

const pendingOutcome = (pending: PendingAnswer): PracticeOutcome =>
  pending.kind === 'answered' ? pending.outcome : 'incorrect';

export const nextQuestion = (series: PracticeSeries): PracticeSeries =>
  series.pending === null
    ? series
    : { ...series, outcomes: [...series.outcomes, pendingOutcome(series.pending)], pending: null };

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

export type PracticeMode = 'notion' | 'timesTables';
