import { describe, expect, it } from 'vitest';
import { resolveGradeBarLightColor, resolveGradeRingColor, DEFAULT_GRADE_RING } from './grades';

describe('resolveGradeRingColor', () => {
  it.each([
    ['BRONZE', 'ring-amber-400'],
    ['SILVER', 'ring-slate-400'],
    ['GOLD', 'ring-yellow-400'],
    ['PLATINE', 'ring-violet-500'],
    ['DIAMOND', 'ring-cyan-400'],
  ])('maps %s to %s', (grade, expected) => {
    expect(resolveGradeRingColor(grade)).toBe(expected);
  });

  it('falls back to the default ring for an unknown grade', () => {
    expect(resolveGradeRingColor('MASTER')).toBe(DEFAULT_GRADE_RING);
  });
});

describe('resolveGradeBarLightColor', () => {
  it.each([
    ['BRONZE', 'bg-amber-200'],
    ['SILVER', 'bg-slate-200'],
    ['GOLD', 'bg-yellow-200'],
    ['PLATINE', 'bg-violet-200'],
    ['DIAMOND', 'bg-cyan-200'],
  ])('maps %s to %s', (grade, expected) => {
    expect(resolveGradeBarLightColor(grade)).toBe(expected);
  });

  it('falls back to the default light color for an unknown grade', () => {
    expect(resolveGradeBarLightColor('MASTER')).toBe('bg-primary-light');
  });
});
