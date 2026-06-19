import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Footer } from './Footer';

describe('Footer', () => {
  it('displays the copyright line with the current year', () => {
    render(<Footer />);
    const year = new Date().getFullYear();
    expect(screen.getByText(`© ${year} Calc Rush. Tous droits réservés.`)).toBeInTheDocument();
  });

  it('links to the external contact page in a new tab', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: 'Contact' });
    expect(link).toHaveAttribute('href', 'https://www.alextraveylan.fr/fr/contact');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
