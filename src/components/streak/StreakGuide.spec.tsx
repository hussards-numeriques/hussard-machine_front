import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StreakGuide } from './StreakGuide';
import { STREAK_TIERS } from './StreakFlame';

describe('StreakGuide', () => {
  it('renders one threshold entry per tier', () => {
    const { container } = render(<StreakGuide />);
    const tierEntries = container.querySelectorAll('[data-tier]');
    expect(tierEntries).toHaveLength(STREAK_TIERS.length);
  });

  it('renders the four daily quest states', () => {
    const { container } = render(<StreakGuide />);
    expect(container.querySelector('[data-quest="secured"]')).not.toBeNull();
    expect(container.querySelector('[data-quest="soft-risk"]')).not.toBeNull();
    expect(container.querySelector('[data-quest="last-chance"]')).not.toBeNull();
    expect(container.querySelector('[data-quest="neutral"]')).not.toBeNull();
  });

  it('explains the freeze and last-chance mechanics', () => {
    render(<StreakGuide />);
    expect(screen.getByText(/gel/i)).toBeInTheDocument();
    expect(screen.getByText(/derni[eè]re chance/i)).toBeInTheDocument();
  });
});
