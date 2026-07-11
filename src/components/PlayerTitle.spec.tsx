import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlayerTitle } from './PlayerTitle';

describe('PlayerTitle', () => {
  it('renders nothing when title is null', () => {
    const { container } = render(<PlayerTitle title={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the label colored by rarity', () => {
    render(
      <PlayerTitle title={{ id: 'win-streak-gold', label: "Légende de l'Arène", rarity: 'GOLD' }} />
    );

    const el = screen.getByText(/Légende de l'Arène/);
    expect(el).toBeInTheDocument();
    expect(el.className).toContain('text-yellow-600');
  });
});
