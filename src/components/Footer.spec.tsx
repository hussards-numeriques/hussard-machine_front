import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n, { LOCALE_STORAGE_KEY } from '../i18n';
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

  it('links to the terms of use page', () => {
    render(<Footer />, { wrapper: MemoryRouter });
    expect(screen.getByRole('link', { name: 'CGU' })).toHaveAttribute('href', '/terms');
  });

  describe('language picker', () => {
    beforeEach(() => localStorage.clear());

    it('switches the language', () => {
      render(<Footer />, { wrapper: MemoryRouter });
      fireEvent.change(screen.getByRole('combobox', { name: 'Langue' }), {
        target: { value: 'en' },
      });
      expect(i18n.language).toBe('en');
      expect(screen.getByRole('link', { name: 'Terms of Sale' })).toBeInTheDocument();
    });

    it('reflects the stored preference', () => {
      localStorage.setItem(LOCALE_STORAGE_KEY, 'de');
      act(() => {
        void i18n.changeLanguage('de');
      });
      render(<Footer />, { wrapper: MemoryRouter });
      expect(screen.getByRole('combobox')).toHaveValue('de');
    });
  });
});
