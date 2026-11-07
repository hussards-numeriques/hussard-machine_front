import { describe, expect, it } from 'vitest';
import {
  answerQuestion,
  clampTimeLimit,
  correctCount,
  isLastQuestion,
  isSeriesFinished,
  nextQuestion,
  ratePractice,
  resolvePracticeOptions,
  resolveTimeLimitSeconds,
  startSeries,
  timeOutQuestion,
  toggleTable,
} from './practice';
import type { PracticeCatalog, PracticeNotion, PracticeTopic } from '../services/practice';

const catalog: PracticeCatalog = {
  CP: { addition: ['addition'], double: ['double'] },
  CM1: {
    multiplication: ['multiplication', 'multiplication_table'],
    addition: ['addition'],
  },
};

const notion: PracticeNotion = { level: 'CM1', category: 'addition', promptType: 'addition' };
const notionTopic: PracticeTopic = { kind: 'notion', ...notion };
const timesTablesTopic: PracticeTopic = { kind: 'timesTables', tables: [6] };

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
    let series = startSeries(notionTopic, 5, 1, null);
    series = answerQuestion(series, 12, 12);
    expect(series.pending).toEqual({ kind: 'answered', given: 12, outcome: 'correct' });
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

  it('keeps the time limit chosen at start', () => {
    expect(startSeries(timesTablesTopic, 5, 1, null).timeLimitSeconds).toBeNull();
    expect(startSeries(timesTablesTopic, 5, 1, 10).timeLimitSeconds).toBe(10);
  });

  it('counts a timed-out question as incorrect and ignores late answers', () => {
    const series = startSeries(timesTablesTopic, 5, 1, 10);
    expect(timeOutQuestion(series).pending).toEqual({ kind: 'timedOut' });
    expect(nextQuestion(timeOutQuestion(series)).outcomes).toEqual(['incorrect']);
    expect(timeOutQuestion(answerQuestion(series, 6, 6)).pending).toMatchObject({
      kind: 'answered',
    });
    expect(answerQuestion(timeOutQuestion(series), 6, 6).pending).toEqual({ kind: 'timedOut' });
    expect(correctCount(nextQuestion(timeOutQuestion(series)))).toBe(0);
  });
});

describe('clampTimeLimit', () => {
  it.each([
    [1, 2],
    [2, 2],
    [50, 50],
    [99, 99],
    [100, 99],
    [12.6, 13],
    [NaN, 10],
  ])('clamps %s to %s', (value, expected) => expect(clampTimeLimit(value)).toBe(expected));
});

describe('toggleTable', () => {
  it('adds a table in order and removes a selected one', () => {
    expect(toggleTable([7], 6)).toEqual([6, 7]);
    expect(toggleTable([6, 7], 6)).toEqual([7]);
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

describe('resolveTimeLimitSeconds', () => {
  it('gives the seconds only when the limit is enabled', () => {
    expect(resolveTimeLimitSeconds({ enabled: true, seconds: 7 })).toBe(7);
    expect(resolveTimeLimitSeconds({ enabled: false, seconds: 7 })).toBeNull();
  });
});
