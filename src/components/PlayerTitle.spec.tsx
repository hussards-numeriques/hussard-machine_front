import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlayerTitle, TitleLabel } from './PlayerTitle';

describe('PlayerTitle', () => {
  it('renders nothing when title is null', () => {
    const { container } = render(<PlayerTitle title={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the label colored by rarity', () => {
    render(
      <PlayerTitle title={{ id: 'win-streak-gold', label: "Légende de l'Arène", rarity: 'GOLD' }} />
    );

    const label = screen.getByTitle('Titre Épique');
    expect(label).toHaveTextContent("Légende de l'Arène");
    expect(label.className).toContain('text-fuchsia-600');
  });

  it('greys out the label and shows a padlock when locked', () => {
    render(<TitleLabel title={{ label: 'Top Player', rarity: 'DIAMOND' }} locked />);

    const label = screen.getByTitle('Titre Légendaire');
    expect(label).toHaveTextContent('🔒 Top Player');
    expect(label.className).toContain('text-slate-400');
  });
});
