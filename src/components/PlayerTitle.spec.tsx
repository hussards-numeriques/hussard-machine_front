import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlayerTitle, TitlePlate } from './PlayerTitle';

describe('PlayerTitle', () => {
  it('renders nothing when title is null', () => {
    const { container } = render(<PlayerTitle title={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the label on a plate styled by rarity', () => {
    render(
      <PlayerTitle title={{ id: 'win-streak-gold', label: "Légende de l'Arène", rarity: 'GOLD' }} />
    );

    const plate = screen.getByTitle('Titre Or');
    expect(plate).toHaveTextContent("★★★Légende de l'Arène");
    expect(plate.className).toContain('title-plate-gold');
  });

  it('shows a padlock instead of the rarity icon when locked', () => {
    render(<TitlePlate title={{ label: 'Top Player', rarity: 'DIAMOND' }} locked />);

    const plate = screen.getByTitle('Titre Diamant');
    expect(plate).toHaveTextContent('🔒Top Player');
    expect(plate.className).toContain('title-plate-locked');
  });
});
