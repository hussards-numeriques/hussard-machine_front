import { describe, expect, it } from 'vitest';
import { getPortfolioContactUrl } from './portfolioContact';

describe('getPortfolioContactUrl', () => {
  it.each(['fr', 'fr-FR'])('links to the French contact page for %s', (language) => {
    expect(getPortfolioContactUrl(language)).toBe(
      'https://www.alextraveylan.fr/fr/calc-rush/contact'
    );
  });

  it.each(['en', 'de', 'pt-BR', 'es', 'it', ''])(
    'falls back to the English contact page for %s',
    (language) => {
      expect(getPortfolioContactUrl(language)).toBe(
        'https://www.alextraveylan.fr/en/calc-rush/contact'
      );
    }
  );
});
