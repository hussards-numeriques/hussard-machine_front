import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '../i18n';
import { LanguagePill } from './LanguagePill';

describe('LanguagePill', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the active language code', () => {
    render(<LanguagePill />);
    expect(screen.getByText('FR')).toBeInTheDocument();
  });

  it('has an accessible name', () => {
    render(<LanguagePill />);
    expect(screen.getByRole('combobox', { name: 'Langue' })).toBeInTheDocument();
  });

  it('switches the language', () => {
    render(<LanguagePill />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Langue' }), {
      target: { value: 'en' },
    });
    expect(i18n.language).toBe('en');
    expect(screen.getByText('EN')).toBeInTheDocument();
  });
});
