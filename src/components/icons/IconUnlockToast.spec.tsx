import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IconUnlockToast } from './IconUnlockToast';
import type { PlayerIcon } from '../../services/icons';

const icon: PlayerIcon = {
  id: 'practice-gold',
  rarity: 'GOLD',
  url: 'http://localhost:8000/static/icons/practice-gold.svg',
};

const renderToast = (icons: PlayerIcon[]) =>
  render(
    <MemoryRouter>
      <IconUnlockToast icons={icons} />
    </MemoryRouter>
  );

describe('IconUnlockToast', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when there are no new icons', () => {
    const { container } = renderToast([]);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the rarity, the icon image and its name', () => {
    renderToast([icon]);
    expect(screen.getByText('Icône Épique débloquée !')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: "Entraîné d'élite" })).toHaveAttribute('src', icon.url);
    expect(screen.getByRole('link', { name: 'Équiper cette icône' })).toHaveAttribute(
      'href',
      '/icons'
    );
  });

  it('dismisses on click of the equip link', () => {
    renderToast([icon]);
    fireEvent.click(screen.getByRole('link', { name: 'Équiper cette icône' }));
    expect(screen.queryByText(/débloquée/)).not.toBeInTheDocument();
  });

  it('auto-dismisses after 10 seconds', () => {
    vi.useFakeTimers();
    renderToast([icon]);
    expect(screen.getByText(/débloquée/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.queryByText(/débloquée/)).not.toBeInTheDocument();
  });
});
