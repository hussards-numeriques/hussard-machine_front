import { describe, expect, it } from 'vitest';
import {
  answerQuestion,
  correctCount,
  isLastQuestion,
  isSeriesFinished,
  nextQuestion,
  ratePractice,
  resolvePracticeOptions,
  startSeries,
} from './practice';
import type { PracticeCatalog, PracticeNotion } from '../services/practice';

const catalog: PracticeCatalog = {
  CP: { addition: ['addition'], double: ['double'] },
  CM1: {
    multiplication: ['multiplication', 'multiplication_table'],
    addition: ['addition'],
  },
};

const notion: PracticeNotion = { level: 'CM1', category: 'addition', promptType: 'addition' };

describe('resolvePracticeOptions', () => {
  it('lists the categories of the level and waits for a category', () => {
    const options = resolvePracticeOptions(catalog, {
      level: 'CM1',
      category: null,
      promptType: null,
    });
    expect(options.categories).toEqual(['multiplication', 'addition']);
    expect(options.promptTypes).toEqual([]);
    expect(options.notion).toBeNull();
  });

  it('auto-selects the only notion of a category', () => {
    const options = resolvePracticeOptions(catalog, {
      level: 'CM1',
      category: 'addition',
      promptType: null,
    });
    expect(options.notion).toEqual(notion);
  });

  it('requires a notion choice when the category holds several', () => {
    const choice = { level: 'CM1', category: 'multiplication', promptType: null } as const;
    expect(resolvePracticeOptions(catalog, choice).notion).toBeNull();
    expect(
      resolvePracticeOptions(catalog, { ...choice, promptType: 'multiplication_table' }).notion
    ).toEqual({ level: 'CM1', category: 'multiplication', promptType: 'multiplication_table' });
  });

  it('drops a category or notion that the level does not offer', () => {
    const options = resolvePracticeOptions(catalog, {
      level: 'CP',
      category: 'multiplication',
      promptType: 'multiplication',
    });
    expect(options.category).toBeNull();
    expect(options.notion).toBeNull();
  });

  it('returns nothing for a level missing from the catalog', () => {
    const options = resolvePracticeOptions(catalog, {
      level: 'TROISIEME',
      category: null,
      promptType: null,
    });
    expect(options.categories).toEqual([]);
  });
});

describe('practice series', () => {
  it('records each answer once, then moves on until the end', () => {
    let series = startSeries(notion, 5, 1);
    series = answerQuestion(series, 12, 12);
    expect(series.pending).toEqual({ given: 12, outcome: 'correct' });
    expect(answerQuestion(series, 3, 12)).toBe(series);
    series = nextQuestion(series);
    expect(nextQuestion(series)).toBe(series);
    series = nextQuestion(answerQuestion(series, 3, 12));
    expect(series.outcomes).toEqual(['correct', 'incorrect']);
    expect(isSeriesFinished(series)).toBe(false);

    for (let i = 0; i < 3; i++) {
      expect(isLastQuestion(series)).toBe(i === 2);
      series = nextQuestion(answerQuestion(series, 1, 1));
    }
    expect(isSeriesFinished(series)).toBe(true);
    expect(correctCount(series)).toBe(4);
  });
});

describe('ratePractice', () => {
  it.each([
    [10, 10, 'perfect'],
    [7, 10, 'great'],
    [4, 10, 'good'],
    [3, 10, 'keepGoing'],
    [0, 5, 'keepGoing'],
  ] as const)('%i/%i is %s', (correct, total, rating) => {
    expect(ratePractice(correct, total)).toBe(rating);
  });
});
