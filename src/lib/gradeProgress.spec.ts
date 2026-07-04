import { describe, expect, it } from 'vitest';
import { computeGradeProgress } from './gradeProgress';
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
