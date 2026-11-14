import { describe, expect, it } from 'vitest';
import { canonicalUrl, DEFAULT_TITLE, documentTitle, isTitledPath, normalizePath } from './seo';

describe('normalizePath', () => {
  it('keeps the root path', () => {
    expect(normalizePath('/')).toBe('/');
  });

  it('strips trailing slashes', () => {
    expect(normalizePath('/terms/')).toBe('/terms');
    expect(normalizePath('//')).toBe('/');
  });
});

describe('canonicalUrl', () => {
  it('points the home page to the www origin with a trailing slash', () => {
    expect(canonicalUrl('/')).toBe('https://www.calc-rush.fr/');
  });

  it('points every other page to itself', () => {
    expect(canonicalUrl('/progression')).toBe('https://www.calc-rush.fr/progression');
    expect(canonicalUrl('/privacy-policy/')).toBe('https://www.calc-rush.fr/privacy-policy');
  });
});

describe('isTitledPath', () => {
  it('recognises the public pages listed in the sitemap', () => {
    expect(isTitledPath('/terms-of-sale')).toBe(true);
    expect(isTitledPath('/legal-notice')).toBe(true);
  });

  it('rejects other paths', () => {
    expect(isTitledPath('/')).toBe(false);
    expect(isTitledPath('/profile')).toBe(false);
    expect(isTitledPath('/constructor')).toBe(false);
  });
});

describe('documentTitle', () => {
  it('suffixes the page title with the site name', () => {
    expect(documentTitle('CGU')).toBe('CGU - Calc Rush');
  });

  it('falls back to the default title', () => {
    expect(documentTitle(null)).toBe(DEFAULT_TITLE);
  });
});
