import { describe, it, expect } from 'vitest';
import { findInkBox, toCrnnInput, CRNN_HEIGHT, CRNN_WIDTH } from './preprocessing';

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

  it('returns a 32x128 Float32Array with values normalized in [0, 1]', () => {
    const ink: [number, number][] = [];
    for (let y = 2; y <= 6; y++) for (let x = 2; x <= 6; x++) ink.push([x, y]);
    const data = makeImage(9, 9, ink);
    const out = toCrnnInput(data, 9, 9);
    expect(out).not.toBeNull();
    expect(out!.length).toBe(CRNN_HEIGHT * CRNN_WIDTH);
    const max = Math.max(...out!);
    const min = Math.min(...out!);
    expect(max).toBeGreaterThan(0);
    expect(max).toBeLessThanOrEqual(1);
    expect(min).toBeGreaterThanOrEqual(0);
  });

  it('inverts the ink: background is black (0), ink is bright (~1)', () => {
    const ink: [number, number][] = [];
    for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) ink.push([x, y]);
    const data = makeImage(9, 9, ink);
    const out = toCrnnInput(data, 9, 9)!;
    // le centre (encre) doit être proche de 1
    const centerY = Math.floor(CRNN_HEIGHT / 2);
    const centerX = Math.floor(CRNN_WIDTH / 2);
    expect(out[centerY * CRNN_WIDTH + centerX]).toBeCloseTo(1, 5);
    // un coin sans encre (padding) doit rester à 0
    expect(out[0]).toBe(0);
  });
});
