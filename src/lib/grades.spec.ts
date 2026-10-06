import { describe, expect, it } from 'vitest';
import {
  resolveGradeBarLightColor,
  resolveGradeMetal,
  DEFAULT_GRADE_METAL,
  isLevel,
  LEVELS,
  resolveLevelLabel,
} from './grades';
import i18n from '../i18n';
import { LOCALES } from '../i18n/locale';

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

describe('resolveLevelLabel', () => {
  it('returns the French short and long labels', () => {
    expect(resolveLevelLabel('SIXIEME', i18n.t, 'short')).toBe('6ème');
    expect(resolveLevelLabel('CP', i18n.t, 'long')).toBe('CP');
  });

  it('returns the US label in English', () => {
    const t = i18n.getFixedT('en');
    expect(resolveLevelLabel('CP', t, 'short')).toBe('G1');
    expect(resolveLevelLabel('TROISIEME', t, 'long')).toBe('Grade 9');
  });

  it.each(LOCALES)('keeps every short label within 4 characters in %s', (locale) => {
    const t = i18n.getFixedT(locale);
    LEVELS.forEach((level) => {
      expect([...resolveLevelLabel(level, t, 'short')].length).toBeLessThanOrEqual(4);
    });
  });

  it('returns an unknown level unchanged', () => {
    expect(resolveLevelLabel('LYCEE', i18n.t, 'short')).toBe('LYCEE');
  });
});
