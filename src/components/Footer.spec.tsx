import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Footer } from './Footer';

describe('Footer', () => {
  it('displays the copyright line with the current year', () => {
    render(<Footer />, { wrapper: MemoryRouter });
    const year = new Date().getFullYear();
    expect(screen.getByText(`© ${year} Calc Rush. Tous droits réservés.`)).toBeInTheDocument();
  });

  it('links to the external contact page in a new tab', () => {
    render(<Footer />, { wrapper: MemoryRouter });
    const link = screen.getByRole('link', { name: 'Contact' });
    expect(link).toHaveAttribute('href', 'https://www.alextraveylan.fr/fr/contact');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('links to the legal notice and privacy policy pages', () => {
    render(<Footer />, { wrapper: MemoryRouter });
    expect(screen.getByRole('link', { name: 'Mentions légales' })).toHaveAttribute(
      'href',
      '/legal-notice'
    );
    expect(screen.getByRole('link', { name: 'Confidentialité' })).toHaveAttribute(
      'href',
      '/privacy-policy'
    );
  });

  it('links to the terms of sale page', () => {
    render(<Footer />, { wrapper: MemoryRouter });
    expect(screen.getByRole('link', { name: 'CGV' })).toHaveAttribute('href', '/terms-of-sale');
  });
});
