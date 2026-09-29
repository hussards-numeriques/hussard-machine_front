import { describe, expect, it } from 'vitest';
import {
  resolveGradeBarLightColor,
  resolveGradeMetal,
  DEFAULT_GRADE_METAL,
  isLevel,
} from './grades';

describe('resolveGradeMetal', () => {
  it.each([
    ['BRONZE', 'grade-metal-bronze'],
    ['SILVER', 'grade-metal-silver'],
    ['GOLD', 'grade-metal-gold'],
    ['PLATINE', 'grade-metal-platine'],
    ['DIAMOND', 'grade-metal-diamond'],
  ])('maps %s to %s', (grade, expected) => {
    expect(resolveGradeMetal(grade)).toBe(expected);
  });

  it('falls back to the default frame for an unknown grade', () => {
    expect(resolveGradeMetal('MASTER')).toBe(DEFAULT_GRADE_METAL);
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

describe('isLevel', () => {
  it.each(['CP', 'CE1', 'CE2', 'CM1', 'CM2', 'SIXIEME', 'CINQUIEME', 'QUATRIEME', 'TROISIEME'])(
    'accepts %s',
    (level) => {
      expect(isLevel(level)).toBe(true);
    }
  );

  it('rejects an unknown value', () => {
    expect(isLevel('TERMINALE')).toBe(false);
  });
});
