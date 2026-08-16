import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IconCard } from './IconCard';
import type { PlayerIcon } from '../../services/icons';

const icon: PlayerIcon = {
  id: 'subscriber-star',
  name: 'Étoile Abonné',
  rarity: 'GOLD',
  url: 'http://localhost:8000/static/icons/subscriber-star.svg',
};

describe('IconCard', () => {
  it('shows an Équiper button when unlocked and not selected', () => {
    render(<IconCard icon={icon} unlocked selected={false} onEquip={vi.fn()} isPending={false} />);

    expect(screen.getByText('Équiper')).toBeInTheDocument();
  });

  it('shows no action button when locked', () => {
    render(
      <IconCard icon={icon} unlocked={false} selected={false} onEquip={vi.fn()} isPending={false} />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onEquip with the icon id when Équiper is clicked', () => {
    const onEquip = vi.fn();
    render(<IconCard icon={icon} unlocked selected={false} onEquip={onEquip} isPending={false} />);

    fireEvent.click(screen.getByText('Équiper'));
    expect(onEquip).toHaveBeenCalledWith('subscriber-star');
  });

  it('shows Équipé and calls onEquip(null) when the equipped card is clicked', () => {
    const onEquip = vi.fn();
    render(<IconCard icon={icon} unlocked selected onEquip={onEquip} isPending={false} />);

    fireEvent.click(screen.getByText('✓ Équipé'));
    expect(onEquip).toHaveBeenCalledWith(null);
  });
});
