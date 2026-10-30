const PORTFOLIO_BASE_URL = 'https://www.alextraveylan.fr';

/** Calc Rush contact page on the portfolio, in French for fr and in English otherwise. */
export function getPortfolioContactUrl(language: string): string {
  const portfolioLocale = language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  return `${PORTFOLIO_BASE_URL}/${portfolioLocale}/calc-rush/contact`;
}
