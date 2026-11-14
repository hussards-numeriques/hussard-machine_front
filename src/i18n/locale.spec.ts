import { describe, it, expect } from 'vitest';
import { deviceLanguages, isCrawler, isLocalePreference, resolveLocale } from './locale';

const GOOGLEBOT_UA =
  'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.204 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const INSPECTION_TOOL_UA =
  'Mozilla/5.0 (compatible; Google-InspectionTool/1.0; +http://www.google.com/bot.html)';
const BINGBOT_UA =
  'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36';
const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
const CUBOT_PHONE_UA =
  'Mozilla/5.0 (Linux; Android 12; CUBOT X50) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36';

describe('isCrawler', () => {
  it.each([GOOGLEBOT_UA, INSPECTION_TOOL_UA, BINGBOT_UA])('detects %s', (userAgent) => {
    expect(isCrawler(userAgent)).toBe(true);
  });

  it.each([CHROME_UA, CUBOT_PHONE_UA, ''])('ignores %s', (userAgent) => {
    expect(isCrawler(userAgent)).toBe(false);
  });
});

describe('deviceLanguages', () => {
  it('gives crawlers the site language whatever they announce', () => {
    expect(resolveLocale('auto', deviceLanguages(GOOGLEBOT_UA, ['en-US']))).toBe('fr');
  });

  it('keeps the browser languages for real visitors', () => {
    expect(deviceLanguages(CHROME_UA, ['en-US', 'fr'])).toEqual(['en-US', 'fr']);
  });
});

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
