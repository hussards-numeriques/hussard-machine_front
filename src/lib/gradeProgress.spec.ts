import { describe, expect, it } from 'vitest';
import { computeGradeProgress, computeGradeDiffSegments } from './gradeProgress';
import type { GameConfig } from '../types';

const config: GameConfig = {
  experience_per_grade: 100,
  promotion_threshold: 500,
  grades: ['BRONZE', 'SILVER', 'GOLD', 'PLATINE', 'DIAMOND'],
  levels: ['CP', 'CE1'],
};

describe('computeGradeProgress', () => {
  it('starts at the first grade with an empty bar', () => {
    const progress = computeGradeProgress(0, false, config);

    expect(progress.gradeIndex).toBe(0);
    expect(progress.nextGrade).toBe('SILVER');
    expect(progress.xpToNextGrade).toBe(100);
    expect(progress.segments.map((s) => s.fillPercent)).toEqual([0, 0, 0, 0, 0]);
  });

  it('fills the current grade segment proportionally', () => {
    const progress = computeGradeProgress(250, false, config);

    expect(progress.gradeIndex).toBe(2);
    expect(progress.nextGrade).toBe('PLATINE');
    expect(progress.xpToNextGrade).toBe(50);
    expect(progress.segments.map((s) => s.fillPercent)).toEqual([100, 100, 50, 0, 0]);
  });

  it('caps the grade index at the last grade', () => {
    const progress = computeGradeProgress(950, false, config);

    expect(progress.gradeIndex).toBe(4);
    expect(progress.nextGrade).toBeNull();
    expect(progress.segments.map((s) => s.fillPercent)).toEqual([100, 100, 100, 100, 50]);
  });

  it('shows a full bar when promotion is available', () => {
    const progress = computeGradeProgress(500, true, config);

    expect(progress.gradeIndex).toBe(4);
    expect(progress.nextGrade).toBeNull();
    expect(progress.segments.map((s) => s.fillPercent)).toEqual([100, 100, 100, 100, 100]);
  });

  it('flags only the current segment', () => {
    const progress = computeGradeProgress(250, false, config);

    expect(progress.segments.map((s) => s.isCurrent)).toEqual([false, false, true, false, false]);
  });

  it('exposes each segment grade in config order', () => {
    const progress = computeGradeProgress(0, false, config);

    expect(progress.segments.map((s) => s.grade)).toEqual(config.grades);
  });
});

describe('computeGradeDiffSegments', () => {
  it('returns matching before/after fill when experience is unchanged (0 XP game)', () => {
    const segments = computeGradeDiffSegments(
      { experience: 250, canPromote: false },
      { experience: 250, canPromote: false },
      config
    );

    expect(segments.map((s) => s.beforeFillPercent)).toEqual([100, 100, 50, 0, 0]);
    expect(segments.map((s) => s.afterFillPercent)).toEqual([100, 100, 50, 0, 0]);
    expect(segments.map((s) => s.grade)).toEqual(config.grades);
  });

  it('grows the diff within the current segment on a normal gain', () => {
    const segments = computeGradeDiffSegments(
      { experience: 220, canPromote: false },
      { experience: 260, canPromote: false },
      config
    );

    expect(segments[2]).toEqual({ grade: 'GOLD', beforeFillPercent: 20, afterFillPercent: 60 });
  });

  it('spreads the diff across two segments when a grade boundary is crossed', () => {
    const segments = computeGradeDiffSegments(
      { experience: 280, canPromote: false },
      { experience: 320, canPromote: false },
      config
    );

    expect(segments[2]).toEqual({ grade: 'GOLD', beforeFillPercent: 80, afterFillPercent: 100 });
    expect(segments[3]).toEqual({ grade: 'PLATINE', beforeFillPercent: 0, afterFillPercent: 20 });
  });

  it('shrinks the diff on a negative XP gain', () => {
    const segments = computeGradeDiffSegments(
      { experience: 260, canPromote: false },
      { experience: 230, canPromote: false },
      config
    );

    expect(segments[2]).toEqual({ grade: 'GOLD', beforeFillPercent: 60, afterFillPercent: 30 });
  });
});
