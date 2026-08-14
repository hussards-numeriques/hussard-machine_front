import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SegmentedXpBar } from './SegmentedXpBar';
import type { GameConfig } from '../../types';

const config: GameConfig = {
  experience_per_grade: 100,
  promotion_threshold: 500,
  grades: ['BRONZE', 'SILVER', 'GOLD', 'PLATINE', 'DIAMOND'],
  levels: ['CP', 'CE1'],
};

describe('SegmentedXpBar', () => {
  it('shows the current XP total', () => {
    render(<SegmentedXpBar experience={250} canPromote={false} config={config} />);
    expect(screen.getByText('250 XP')).toBeInTheDocument();
  });

  it('shows how much XP is needed for the next grade', () => {
    render(<SegmentedXpBar experience={250} canPromote={false} config={config} />);
    expect(screen.getByText('50 XP pour Platine')).toBeInTheDocument();
  });

  it('shows the promotion-available message when the bar is full', () => {
    render(<SegmentedXpBar experience={500} canPromote={true} config={config} />);
    expect(screen.getByText(/promotion disponible/)).toBeInTheDocument();
  });
});
