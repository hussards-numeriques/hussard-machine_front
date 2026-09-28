import { describe, it, expect } from 'vitest';
import { resolveAnswerInputMode, isAnswerInputMode } from './mode';

describe('resolveAnswerInputMode', () => {
  it('resolves auto to handwriting on a coarse pointer', () => {
    expect(resolveAnswerInputMode('auto', true)).toBe('handwriting');
  });

  it('resolves auto to keyboard on a fine pointer', () => {
    expect(resolveAnswerInputMode('auto', false)).toBe('keyboard');
  });

  it('keeps explicit modes regardless of pointer', () => {
    expect(resolveAnswerInputMode('keypad', true)).toBe('keypad');
    expect(resolveAnswerInputMode('handwriting', false)).toBe('handwriting');
    expect(resolveAnswerInputMode('keyboard', true)).toBe('keyboard');
  });
});

describe('isAnswerInputMode', () => {
  it('accepts valid modes and rejects anything else', () => {
    expect(isAnswerInputMode('auto')).toBe(true);
    expect(isAnswerInputMode('keypad')).toBe(true);
    expect(isAnswerInputMode('nope')).toBe(false);
    expect(isAnswerInputMode(null)).toBe(false);
  });
});
