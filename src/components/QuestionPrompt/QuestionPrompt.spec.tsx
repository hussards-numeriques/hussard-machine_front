import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QuestionPrompt } from './QuestionPrompt';
import type { ExpressionNode, QuestionPrompt as Prompt } from '../../types';

const renderPrompt = (prompt: Prompt) => {
  render(<QuestionPrompt prompt={prompt} />);
  const element = screen.getByTestId('question-prompt');
  return {
    element,
    spoken: () => element.querySelector('.sr-only')?.textContent?.replace(/\s+/g, ' '),
    text: () => element.textContent?.replace(/\s+/g, ' ').trim(),
  };
};

const n = (value: number): ExpressionNode => ({ kind: 'number', value });

describe('QuestionPrompt', () => {
  it.each<[Prompt, string]>([
    [{ type: 'addition', left: 38, right: 9 }, '38 + 9'],
    [{ type: 'subtraction', left: 45, right: 12 }, '45 − 12'],
    [{ type: 'multiplication_table', table: 7, factor: 8 }, '7 × 8'],
    [{ type: 'multiplication', left: 23, right: 25 }, '23 × 25'],
    [{ type: 'division_table', dividend: 56, divisor: 7 }, '56 ÷ 7'],
    [{ type: 'difference_of_squares', center: 16, offset: 1 }, '17 × 15'],
    [{ type: 'division', dividend: 84, divisor: 4 }, '84 ÷ 4'],
    [{ type: 'complement', value: 640, target: 1000 }, '640 + ? = 1 000'],
    [{ type: 'double', value: 25 }, 'Le double de25'],
    [{ type: 'half', value: 42 }, 'La moitié de42'],
    [{ type: 'multiplication_by_power_of_10', factor: 23, exponent: 2 }, '23 × 100'],
    [{ type: 'multiplication_by_power_of_10', factor: 7, exponent: 3 }, '7 × 1 000'],
    [{ type: 'relative_addition', left: -12, right: -4 }, '−12 + (−4)'],
    [{ type: 'relative_subtraction', left: 5, right: -8 }, '5 − (−8)'],
    [{ type: 'relative_multiplication', left: -3, right: -4 }, '−3 × (−4)'],
    [{ type: 'relative_division', dividend: -36, divisor: 4 }, '−36 ÷ 4'],
    [{ type: 'missing_factor', factor: -4, product: 28 }, '−4 × ? = 28'],
    [{ type: 'percentage_of_quantity', rate: 25, quantity: 80 }, '25 % de 80'],
    [{ type: 'gcd', left: 36, right: 48 }, 'PGCD(36 ; 48)'],
  ])('renders %o as %s', (prompt, expected) => {
    expect(renderPrompt(prompt).text()).toBe(expected);
  });

  it('highlights the table being practiced', () => {
    renderPrompt({ type: 'multiplication_table', table: 7, factor: 8 });
    expect(screen.getByText('7')).toHaveClass('text-primary');
  });

  it('highlights the divisor of a division table', () => {
    renderPrompt({ type: 'division_table', dividend: 56, divisor: 7 });
    expect(screen.getByText('7')).toHaveClass('text-primary');
  });

  it('highlights the power of ten', () => {
    renderPrompt({ type: 'multiplication_by_power_of_10', factor: 23, exponent: 2 });
    expect(screen.getByText('100')).toHaveClass('text-primary');
  });

  it('renders operation priorities with minimal parentheses', () => {
    expect(
      renderPrompt({
        type: 'operation_priority',
        expression: {
          kind: 'operation',
          operator: 'multiply',
          left: { kind: 'operation', operator: 'add', left: n(2), right: n(5) },
          right: n(3),
        },
      }).text()
    ).toBe('(2 + 5) × 3');
  });

  it('renders relative operation priorities with parenthesized negatives', () => {
    expect(
      renderPrompt({
        type: 'relative_operation_priority',
        expression: {
          kind: 'operation',
          operator: 'subtract',
          left: { kind: 'operation', operator: 'multiply', left: n(-3), right: n(-4) },
          right: n(-5),
        },
      }).text()
    ).toBe('−3 × (−4) − (−5)');
  });

  it('stacks the fraction of a quantity', () => {
    const { element, spoken, text } = renderPrompt({
      type: 'fraction_of_quantity',
      numerator: 3,
      denominator: 4,
      quantity: 60,
    });
    expect(spoken()).toBe('3/4');
    expect(text()).toContain('de 60');
    expect(element.querySelector('[aria-hidden] .flex-col')?.textContent).toBe('34');
  });

  it('renders a square with a superscript 2', () => {
    const { element, spoken } = renderPrompt({ type: 'square', base: 7 });
    expect(element.querySelector('sup')).toHaveTextContent('2');
    expect(spoken()).toBe('7 puissance 2');
  });

  it('puts the exponent in a superscript and parenthesizes a negative base', () => {
    const { element, spoken } = renderPrompt({ type: 'power', base: -3, exponent: 4 });
    expect(element.querySelector('sup')).toHaveTextContent('4');
    expect(spoken()).toBe('(−3) puissance 4');
  });

  it('draws a square root over the radicand', () => {
    const { spoken, element } = renderPrompt({ type: 'square_root', radicand: 196 });
    expect(spoken()).toBe('Racine carrée de 196');
    expect(element).toHaveTextContent('√');
  });

  it.each([
    ['remainder', 'Quel est le reste ?', 'Reste de la division euclidienne de 47 par 5'],
    ['quotient', 'Quel est le quotient ?', 'Quotient de la division euclidienne de 47 par 5'],
  ] as const)('poses the euclidean division asking for the %s', (asked, question, spoken) => {
    const prompt = renderPrompt({ type: 'euclidean_division', dividend: 47, divisor: 5, asked });
    expect(screen.getByText(question)).toBeInTheDocument();
    expect(prompt.spoken()).toBe(spoken);
  });

  it('renders a linear equation with an italic unknown', () => {
    const { element, text } = renderPrompt({
      type: 'linear_equation',
      left: { coefficient: -1, constant: 2 },
      right: { coefficient: 0, constant: 11 },
    });
    expect(text()).toBe('−x + 2 = 11x = ?');
    expect(element.querySelectorAll('var')).toHaveLength(2);
  });

  it('renders an equation with unknowns on both sides', () => {
    expect(
      renderPrompt({
        type: 'linear_equation',
        left: { coefficient: 5, constant: 2 },
        right: { coefficient: 2, constant: -7 },
      }).text()
    ).toBe('5x + 2 = 2x − 7x = ?');
  });

  it('renders a function image question', () => {
    expect(
      renderPrompt({
        type: 'function_image',
        function: { coefficient: 1, constant: -2 },
        x: -4,
      }).text()
    ).toBe('f(x) = x − 2f(−4) = ?');
  });

  it('renders a function antecedent question', () => {
    expect(
      renderPrompt({
        type: 'function_antecedent',
        function: { coefficient: 3, constant: 0 },
        image: 12,
      }).text()
    ).toBe('f(x) = 3xf(?) = 12');
  });
});
