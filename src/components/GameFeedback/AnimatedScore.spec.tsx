import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AnimatedScore } from './AnimatedScore';

describe('AnimatedScore', () => {
  it('renders the score with its unit', () => {
    // Given / When
    render(<AnimatedScore score={135} />);

    // Then
    expect(screen.getByText('135 pts')).toBeInTheDocument();
  });

  it('pulses when the score increases', () => {
    // Given
    const { rerender } = render(<AnimatedScore score={0} />);

    // When
    act(() => {
      rerender(<AnimatedScore score={135} />);
    });

    // Then
    expect(screen.getByText('135 pts').className).toContain('animate-combo-grow');
  });
});
