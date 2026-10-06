import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import i18n, { LOCALE_STORAGE_KEY, readLocalePreference } from '../i18n';
import { useLocalePreference } from './useLocalePreference';

describe('useLocalePreference', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to auto', () => {
    const { result } = renderHook(() => useLocalePreference());
    expect(result.current[0]).toBe('auto');
  });

  it.each(['xx', 'pt', ''])('treats corrupt stored value %j as auto', (stored) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, stored);
    const { result } = renderHook(() => useLocalePreference());
    expect(result.current[0]).toBe('auto');
  });

  it('persists the choice and switches i18n and <html lang>', () => {
    const { result } = renderHook(() => useLocalePreference());
    act(() => result.current[1]('de'));
    expect(result.current[0]).toBe('de');
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('de');
    expect(i18n.language).toBe('de');
    expect(document.documentElement.lang).toBe('de');
  });

  it('auto resolves from navigator.languages', () => {
    const { result } = renderHook(() => useLocalePreference());
    act(() => result.current[1]('auto'));
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('auto');
    expect(i18n.language).toBe('en');
  });

  it('falls back to auto when storage throws on read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readLocalePreference()).toBe('auto');
    vi.restoreAllMocks();
  });

  it('still switches language when storage throws on write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() => useLocalePreference());
    act(() => result.current[1]('es'));
    expect(i18n.language).toBe('es');
    vi.restoreAllMocks();
  });
});
