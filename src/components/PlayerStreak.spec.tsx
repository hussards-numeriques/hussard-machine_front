import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlayerStreak } from './PlayerStreak';

describe('PlayerStreak', () => {
  it('renders nothing when the streak is zero', () => {
    const { container } = render(<PlayerStreak count={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for a negative streak', () => {
    const { container } = render(<PlayerStreak count={-1} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the count and the flame matching the tier', () => {
    const { container } = render(<PlayerStreak count={30} />);
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(container.querySelector('[data-tier="violet"]')).not.toBeNull();
  });
});
