import { describe, expect, it } from 'vitest';
import i18n from '../i18n';
import type { ExpressionNode } from '../types';
import {
  formatAffine,
  formatBinary,
  formatExpression,
  formatInteger,
  formatPercent,
} from './mathFormat';

const plain = (text: string) => text.replace(/[\u00A0\u202F]/g, ' ');
const n = (value: number): ExpressionNode => ({ kind: 'number', value });
const op = (
  operator: 'add' | 'subtract' | 'multiply' | 'divide',
  left: ExpressionNode,
  right: ExpressionNode
): ExpressionNode => ({ kind: 'operation', operator, left, right });

describe('formatInteger', () => {
  it('uses French thousands separators and the true minus sign', () => {
    expect(plain(formatInteger(1234567))).toBe('1 234 567');
    expect(plain(formatInteger(-1000))).toBe('−1 000');
    expect(formatInteger(0)).toBe('0');
  });
});

describe('formatBinary', () => {
  it('wraps negative right operands in parentheses but not a leading one', () => {
    expect(plain(formatBinary('add', -12, -4))).toBe('−12 + (−4)');
    expect(plain(formatBinary('subtract', 5, -8))).toBe('5 − (−8)');
    expect(plain(formatBinary('multiply', -3, -4))).toBe('−3 × (−4)');
    expect(plain(formatBinary('divide', -63, 7))).toBe('−63 ÷ 7');
  });
});

describe('formatExpression', () => {
  it('omits parentheses when precedence already applies', () => {
    expect(plain(formatExpression(op('add', n(4), op('multiply', n(3), n(7)))))).toBe('4 + 3 × 7');
    expect(plain(formatExpression(op('subtract', op('multiply', n(-3), n(-4)), n(-5))))).toBe(
      '−3 × (−4) − (−5)'
    );
  });

  it('adds parentheses around a sum inside a product', () => {
    expect(plain(formatExpression(op('multiply', op('add', n(2), n(5)), n(3))))).toBe(
      '(2 + 5) × 3'
    );
    expect(plain(formatExpression(op('multiply', n(3), op('subtract', n(9), n(4)))))).toBe(
      '3 × (9 − 4)'
    );
  });

  it('keeps right-hand groups of subtractions and divisions', () => {
    expect(plain(formatExpression(op('subtract', n(10), op('add', n(2), n(3)))))).toBe(
      '10 − (2 + 3)'
    );
    expect(plain(formatExpression(op('add', n(10), op('subtract', n(2), n(3)))))).toBe(
      '10 + 2 − 3'
    );
    expect(plain(formatExpression(op('divide', n(60), op('multiply', n(2), n(3)))))).toBe(
      '60 ÷ (2 × 3)'
    );
    expect(plain(formatExpression(op('subtract', op('subtract', n(10), n(2)), n(3))))).toBe(
      '10 − 2 − 3'
    );
  });

  it('does not double-wrap a negative number leading a parenthesized group', () => {
    expect(plain(formatExpression(op('multiply', op('add', n(-2), n(5)), n(3))))).toBe(
      '(−2 + 5) × 3'
    );
  });
});

describe('formatAffine', () => {
  it.each([
    [{ coefficient: 3, constant: -4 }, '3x − 4'],
    [{ coefficient: 3, constant: 2 }, '3x + 2'],
    [{ coefficient: 1, constant: 5 }, 'x + 5'],
    [{ coefficient: -1, constant: 0 }, '−x'],
    [{ coefficient: -2, constant: -7 }, '−2x − 7'],
    [{ coefficient: 0, constant: 11 }, '11'],
    [{ coefficient: 0, constant: -11 }, '−11'],
    [{ coefficient: 0, constant: 0 }, '0'],
    [{ coefficient: 4, constant: 0 }, '4x'],
  ])('formats %o as %s', (expression, expected) => {
    expect(plain(formatAffine(expression))).toBe(expected);
  });
});

describe('formatPercent', () => {
  it('uses the French narrow no-break space', () => {
    expect(formatPercent(50)).toBe('50\u202F%');
  });

  it('follows the active language', async () => {
    await i18n.changeLanguage('en');
    expect(formatPercent(50)).toBe('50%');
  });
});
