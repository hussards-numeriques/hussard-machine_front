import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import i18n from '../i18n';
import { LegalTranslationNotice } from './LegalTranslationNotice';

const ENGLISH_NOTICE =
  'Translation provided for convenience only; the French version is the only legally binding one.';

describe('LegalTranslationNotice', () => {
  it('renders nothing in French', () => {
    const { container } = render(<LegalTranslationNotice />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the English notice after switching language', async () => {
    await i18n.changeLanguage('en');
    render(<LegalTranslationNotice />);

    expect(screen.getByText(ENGLISH_NOTICE)).toBeInTheDocument();
  });
});
