import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAnswerInputMode, ANSWER_INPUT_MODE_STORAGE_KEY } from './useAnswerInputMode';

describe('useAnswerInputMode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to auto when nothing is stored', () => {
    const { result } = renderHook(() => useAnswerInputMode());
    expect(result.current[0]).toBe('auto');
  });

  it('falls back to auto when the stored value is invalid', () => {
    localStorage.setItem(ANSWER_INPUT_MODE_STORAGE_KEY, 'garbage');
    const { result } = renderHook(() => useAnswerInputMode());
    expect(result.current[0]).toBe('auto');
  });

  it('persists and exposes a new mode', () => {
    const { result } = renderHook(() => useAnswerInputMode());
    act(() => result.current[1]('keypad'));
    expect(result.current[0]).toBe('keypad');
    expect(localStorage.getItem(ANSWER_INPUT_MODE_STORAGE_KEY)).toBe('keypad');
  });

  it('shares state across hook instances', () => {
    const a = renderHook(() => useAnswerInputMode());
    const b = renderHook(() => useAnswerInputMode());
    act(() => a.result.current[1]('handwriting'));
    expect(b.result.current[0]).toBe('handwriting');
  });
});
