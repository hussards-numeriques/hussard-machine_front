import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Dot } from './Dot';

describe('Dot', () => {
  it.each([
    ['success', 'bg-emerald-500'],
    ['danger', 'bg-red-400'],
    ['neutral', 'bg-slate-300'],
  ] as const)('renders the %s variant with %s', (variant, expectedClass) => {
    const { getByTestId } = render(<Dot variant={variant} />);
    expect(getByTestId('dot')).toHaveClass(expectedClass);
  });

  it('exposes no accessible label when none is given', () => {
    const { getByTestId } = render(<Dot variant="success" />);
    expect(getByTestId('dot')).not.toHaveAttribute('role');
  });

  it('exposes the given label as an accessible image', () => {
    const { getByRole } = render(<Dot variant="success" label="Correcte" />);
    expect(getByRole('img', { name: 'Correcte' })).toBeInTheDocument();
  });
});
