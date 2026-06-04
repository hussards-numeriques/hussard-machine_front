import { describe, it, expect } from 'vitest';
import { findInkBox, toMnistInput, MNIST_SIZE } from './preprocessing';

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

describe('toMnistInput', () => {
  it('returns null on a blank image', () => {
    const data = makeImage(8, 8, []);
    expect(toMnistInput(data, 8, 8)).toBeNull();
  });

  it('returns a 28x28 Float32Array with positive ink intensity', () => {
    const ink: [number, number][] = [];
    for (let y = 2; y <= 6; y++) for (let x = 2; x <= 6; x++) ink.push([x, y]);
    const data = makeImage(9, 9, ink);
    const out = toMnistInput(data, 9, 9);
    expect(out).not.toBeNull();
    expect(out!.length).toBe(MNIST_SIZE * MNIST_SIZE);
    expect(Math.max(...out!)).toBeGreaterThan(0);
  });
});
