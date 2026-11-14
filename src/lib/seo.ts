export const SITE_ORIGIN = 'https://www.calc-rush.fr';
export const SITE_NAME = 'Calc Rush';
export const DEFAULT_TITLE = 'Calc Rush - Calcul Mental';

export const PAGE_TITLE_KEYS = {
  '/progression': 'progression.title',
  '/terms': 'legal.terms.title',
  '/terms-of-sale': 'legal.sale.title',
  '/legal-notice': 'legal.notice.title',
  '/privacy-policy': 'legal.privacy.title',
} as const;

export type TitledPath = keyof typeof PAGE_TITLE_KEYS;

export const isTitledPath = (pathname: string): pathname is TitledPath =>
  Object.hasOwn(PAGE_TITLE_KEYS, pathname);

export const normalizePath = (pathname: string): string => {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
};

export const canonicalUrl = (pathname: string): string => {
  const path = normalizePath(pathname);
  return path === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`;
};

export const documentTitle = (pageTitle: string | null): string =>
  pageTitle ? `${pageTitle} - ${SITE_NAME}` : DEFAULT_TITLE;
