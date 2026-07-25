import { describe, it, expect } from 'vitest';
import {
  findInkBox,
  toCrnnInput,
  preprocessInkHigh,
  CRNN_HEIGHT,
  CRNN_WIDTH,
} from './preprocessing';

function makeImage(width: number, height: number, inkPixels: [number, number][]) {
  const data = new Uint8ClampedArray(width * height * 4).fill(255);
  for (const [x, y] of inkPixels) {
    const i = (y * width + x) * 4;
    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;
    data[i + 3] = 255;
  }
  return data;
}

describe('findInkBox', () => {
  it('returns null when the image has no ink', () => {
    const data = makeImage(4, 4, []);
    expect(findInkBox(data, 4, 4)).toBeNull();
  });

  it('returns the tight bounding box of ink pixels', () => {
    const data = makeImage(5, 5, [
      [1, 2],
      [3, 1],
    ]);
    expect(findInkBox(data, 5, 5)).toEqual({ minX: 1, minY: 1, maxX: 3, maxY: 2 });
  });
});

describe('toCrnnInput', () => {
  it('returns null on a blank image', () => {
    const data = makeImage(8, 8, []);
    expect(toCrnnInput(data, 8, 8)).toBeNull();
  });

  it('returns a 32x128 Float32Array normalized in [0,1] with ink present', () => {
    const ink: [number, number][] = [];
    for (let y = 2; y <= 6; y++) for (let x = 2; x <= 6; x++) ink.push([x, y]);
    const out = toCrnnInput(makeImage(9, 9, ink), 9, 9)!;
    expect(out.length).toBe(CRNN_HEIGHT * CRNN_WIDTH);
    expect(Math.max(...out)).toBeGreaterThan(0);
    expect(Math.max(...out)).toBeLessThanOrEqual(1);
    expect(Math.min(...out)).toBeGreaterThanOrEqual(0);
  });

  it('area-resizes a constant ink block to a near-constant value (no aliasing gaps)', () => {
    // un bloc plein d'encre -> après area-resize, la zone dessinée est uniforme ~1
    const w = 60;
    const h = 30;
    const ink = new Float32Array(w * h).fill(1);
    const out = preprocessInkHigh(ink, w, h);
    // toutes les colonnes dessinées (non nulles) valent ~1
    const drawn = Array.from(out).filter((v) => v > 0);
    expect(drawn.length).toBeGreaterThan(0);
    for (const v of drawn) expect(v).toBeCloseTo(1, 5);
  });
});
