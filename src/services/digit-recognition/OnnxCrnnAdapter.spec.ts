import { describe, it, expect } from 'vitest';
import { decodeCtc } from './OnnxCrnnAdapter';

const NUM_CLASSES = 11;
const BLANK = 10;

// Construit un Float32Array [T, C] où chaque timestep a un pic (1) sur la classe
// argmax fournie et 0 ailleurs.
function logitsFrom(argmaxPerStep: number[]): Float32Array {
  const out = new Float32Array(argmaxPerStep.length * NUM_CLASSES);
  argmaxPerStep.forEach((cls, t) => {
    out[t * NUM_CLASSES + cls] = 1;
  });
  return out;
}

describe('decodeCtc', () => {
  it('returns null when every timestep is blank', () => {
    const logits = logitsFrom([BLANK, BLANK, BLANK]);
    expect(decodeCtc(logits, 3, NUM_CLASSES)).toBeNull();
  });

  it('decodes a single digit', () => {
    const logits = logitsFrom([BLANK, 7, 7, BLANK]);
    expect(decodeCtc(logits, 4, NUM_CLASSES)).toBe(7);
  });

  it('merges consecutive repeats and skips blanks', () => {
    // 4, 4, blank, 2, 2 -> "42" (les 4 collés fusionnent, le blank sépare)
    const logits = logitsFrom([4, 4, BLANK, 2, 2]);
    expect(decodeCtc(logits, 5, NUM_CLASSES)).toBe(42);
  });

  it('keeps a real double digit separated by a blank', () => {
    // 3, blank, 3 -> "33" (le blank empêche la fusion)
    const logits = logitsFrom([3, BLANK, 3]);
    expect(decodeCtc(logits, 3, NUM_CLASSES)).toBe(33);
  });

  it('decodes a three-digit number', () => {
    const logits = logitsFrom([BLANK, 1, 1, BLANK, 2, BLANK, 3, 3, BLANK]);
    expect(decodeCtc(logits, 9, NUM_CLASSES)).toBe(123);
  });

  it('preserves leading digits (does not drop leading value)', () => {
    const logits = logitsFrom([9, BLANK, 0, BLANK, 5]);
    expect(decodeCtc(logits, 5, NUM_CLASSES)).toBe(905);
  });
});
