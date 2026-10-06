import { describe, it, expect } from 'vitest';
import { isLocalePreference, resolveLocale } from './locale';

describe('resolveLocale', () => {
  it('returns the explicit preference', () => {
    expect(resolveLocale('de', ['fr-FR'])).toBe('de');
  });

  it.each([
    [['fr-FR'], 'fr'],
    [['es-MX'], 'es'],
    [['pt-PT'], 'pt-BR'],
    [['pt-BR'], 'pt-BR'],
    [['en-GB'], 'en'],
    [['it'], 'it'],
    [['DE-at'], 'de'],
    [['nl-NL', 'es-ES'], 'es'],
    [['nl-NL'], 'en'],
    [['zh-CN'], 'en'],
    [[], 'en'],
  ])('auto with %j resolves to %s', (languages, expected) => {
    expect(resolveLocale('auto', languages)).toBe(expected);
  });
});

describe('isLocalePreference', () => {
  it.each(['auto', 'fr', 'pt-BR'])('accepts %s', (value) => {
    expect(isLocalePreference(value)).toBe(true);
  });

  it.each(['xx', 'pt', '', null, 42])('rejects %j', (value) => {
    expect(isLocalePreference(value)).toBe(false);
  });
});
