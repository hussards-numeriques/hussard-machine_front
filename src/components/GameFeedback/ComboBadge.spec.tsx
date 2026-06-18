import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComboBadge } from './ComboBadge';

describe('ComboBadge', () => {
  it('renders nothing below a combo of 2', () => {
    // Given / When
    const { container } = render(<ComboBadge combo={1} />);

    // Then
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the combo multiplier when at least 2', () => {
    // Given / When
    render(<ComboBadge combo={3} />);

    // Then
    expect(screen.getByText('x3')).toBeInTheDocument();
  });
});
