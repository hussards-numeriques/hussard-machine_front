import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TitlesLevelBanner } from './TitlesLevelBanner';
import type { TitlesLevelView } from '../../lib/titlesLevelView';

describe('TitlesLevelBanner', () => {
  it('renders the active copy for an active level', () => {
    const view: TitlesLevelView = { kind: 'active', level: 'TROISIEME' };
    render(<TitlesLevelBanner view={view} />);

    expect(screen.getByText('Titres actifs — niveau 3ème.')).toBeInTheDocument();
    expect(
      screen.getByText(
        "C'est ton niveau actuel : tes parties en 3ème font avancer ces quêtes, et le titre que tu équipes ici s'affiche en jeu."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the inactive-memories copy', () => {
    const view: TitlesLevelView = {
      kind: 'inactive-memories',
      level: 'CP',
      currentLevel: 'TROISIEME',
    };
    render(<TitlesLevelBanner view={view} />);

    expect(screen.getByText('Niveau CP — titres inactifs.')).toBeInTheDocument();
    expect(
      screen.getByText(
        "Ce n'est plus ton niveau : ces titres ne s'affichent plus en jeu et ne peuvent pas être équipés. Ils sont là pour la nostalgie du passé ! Tes titres actifs sont ceux du niveau 3ème."
      )
    ).toBeInTheDocument();
  });

  it('renders the inactive-empty copy', () => {
    const view: TitlesLevelView = { kind: 'inactive-empty', level: 'CE1', currentLevel: 'CP' };
    render(<TitlesLevelBanner view={view} />);

    expect(screen.getByText('Niveau CE1 — titres inactifs.')).toBeInTheDocument();
    expect(
      screen.getByText(
        "Aucun souvenir ici pour l'instant. Seuls les titres de ton niveau actuel (CP) sont actifs."
      )
    ).toBeInTheDocument();
  });
});
