import { describe, it, expect } from 'vitest';
import { preprocessInkHigh } from './preprocessing';
import cases from './__fixtures__/parity-cases.json';

describe('parité Python↔TS de preprocess_ink', () => {
  it('reproduit les sorties de référence dans la tolérance', () => {
    for (const c of cases as Array<{
      width: number;
      height: number;
      ink: number[];
      expected: number[];
    }>) {
      const ink = Float32Array.from(c.ink);
      const out = preprocessInkHigh(ink, c.width, c.height);
      expect(out.length).toBe(c.expected.length);
      let maxDiff = 0;
      for (let i = 0; i < out.length; i++)
        maxDiff = Math.max(maxDiff, Math.abs(out[i] - c.expected[i]));
      expect(maxDiff).toBeLessThan(1e-4);
    }
  });
});
