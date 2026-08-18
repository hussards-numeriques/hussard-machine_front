import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EndGameXpProgress } from './EndGameXpProgress';
import type { GameConfig } from '../../types';
import type { XpProgress } from '../../hooks/useXpProgress';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const config: GameConfig = {
  experience_per_grade: 100,
  promotion_threshold: 500,
  grades: ['BRONZE', 'SILVER', 'GOLD', 'PLATINE', 'DIAMOND'],
  levels: ['CP', 'CE1'],
};

describe('EndGameXpProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a frozen before-only bar while the after-state is not settled', () => {
    const progress: XpProgress = {
      before: { experience: 100, canPromote: false },
      after: null,
    };
    const { container } = render(<EndGameXpProgress progress={progress} config={config} />);
    expect(screen.getByText('100 XP')).toBeInTheDocument();
    expect(screen.getByText('Progression')).toBeInTheDocument();
    expect(container.querySelector('.animate-pop-in')).not.toBeInTheDocument();
    expect(screen.queryByText(/^[+-]\d+ XP$/)).not.toBeInTheDocument();
  });

  it('shows the gained XP for a positive diff', () => {
    const progress: XpProgress = {
      before: { experience: 100, canPromote: false },
      after: { experience: 140, canPromote: false },
    };
    render(<EndGameXpProgress progress={progress} config={config} />);
    expect(screen.getByText('+40 XP')).toBeInTheDocument();
  });

  it('shows +0 XP for a room game with no gain', () => {
    const progress: XpProgress = {
      before: { experience: 100, canPromote: false },
      after: { experience: 100, canPromote: false },
    };
    render(<EndGameXpProgress progress={progress} config={config} />);
    expect(screen.getByText('+0 XP')).toBeInTheDocument();
  });

  it('shows a negative diff in red', () => {
    const progress: XpProgress = {
      before: { experience: 100, canPromote: false },
      after: { experience: 80, canPromote: false },
    };
    render(<EndGameXpProgress progress={progress} config={config} />);
    const badge = screen.getByText('-20 XP');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-red-500');
  });

  it('shows the final XP total and promotion message when the bar is full', () => {
    const progress: XpProgress = {
      before: { experience: 460, canPromote: false },
      after: { experience: 500, canPromote: true },
    };
    render(<EndGameXpProgress progress={progress} config={config} />);
    expect(screen.getByText('500 XP')).toBeInTheDocument();
    expect(screen.getByText(/promotion disponible/)).toBeInTheDocument();
  });

  it('fires a confetti burst once when a grade boundary is crossed', async () => {
    vi.useFakeTimers();
    const confetti = (await import('canvas-confetti')).default;
    const progress: XpProgress = {
      before: { experience: 80, canPromote: false },
      after: { experience: 120, canPromote: false },
    };
    render(<EndGameXpProgress progress={progress} config={config} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });

    expect(confetti).toHaveBeenCalledTimes(1);
  });

  it('also fires the grade-crossed confetti when the crossing reaches the bar max (promotion)', async () => {
    vi.useFakeTimers();
    const confetti = (await import('canvas-confetti')).default;
    const progress: XpProgress = {
      before: { experience: 380, canPromote: false },
      after: { experience: 500, canPromote: true },
    };
    render(<EndGameXpProgress progress={progress} config={config} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });

    expect(confetti).toHaveBeenCalledTimes(1);
  });

  it('shows the player level next to the title when given', () => {
    const progress: XpProgress = {
      before: { experience: 100, canPromote: false },
      after: null,
    };
    render(<EndGameXpProgress progress={progress} config={config} level="CM2" />);
    expect(screen.getByText('CM2')).toBeInTheDocument();
  });

  it('omits the level badge when no level is given', () => {
    const progress: XpProgress = {
      before: { experience: 100, canPromote: false },
      after: null,
    };
    render(<EndGameXpProgress progress={progress} config={config} />);
    expect(screen.queryByText('CM2')).not.toBeInTheDocument();
  });
});
