import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TitleUnlockToast } from './TitleUnlockToast';
import type { MyTitle } from '../../services/quests';

const title: MyTitle = {
  id: 'win-streak-gold',
  label: "Légende de l'Arène",
  rarity: 'GOLD',
  unlocked_at: '2026-07-12T00:00:00',
};

describe('TitleUnlockToast', () => {
  it('renders nothing when there are no new titles', () => {
    const { container } = render(<TitleUnlockToast titles={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a toast for a newly unlocked title', () => {
    render(<TitleUnlockToast titles={[title]} />);
    expect(screen.getByText(/Titre Or débloqué/)).toBeInTheDocument();
    expect(screen.getByText("Légende de l'Arène")).toBeInTheDocument();
  });

  it('auto-dismisses the toast after the timeout', () => {
    vi.useFakeTimers();
    render(<TitleUnlockToast titles={[title]} />);
    expect(screen.getByText(/débloqué/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.queryByText(/débloqué/)).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
