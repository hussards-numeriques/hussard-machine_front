import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StreakFlame, getStreakTier } from './index';

describe('getStreakTier', () => {
  it.each([
    [0, 'ember'],
    [1, 'ember'],
    [2, 'ember'],
    [3, 'orange'],
    [6, 'orange'],
    [7, 'amber'],
    [13, 'amber'],
    [14, 'blue'],
    [29, 'blue'],
    [30, 'violet'],
    [59, 'violet'],
    [60, 'gold'],
    [365, 'gold'],
  ])('count %i maps to tier %s', (count, expected) => {
    expect(getStreakTier(count).id).toBe(expected);
  });
});

describe('StreakFlame', () => {
  it('renders the svg of the tier matching the count', () => {
    const { container } = render(<StreakFlame count={14} animated={false} />);
    expect(container.querySelector('[data-tier="blue"]')).not.toBeNull();
  });
});
