export const MNIST_SIZE = 28;
const INNER_BOX = 20;
const INK_THRESHOLD = 200;

export interface InkBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const luminance = (data: Uint8ClampedArray, i: number): number =>
  (data[i] + data[i + 1] + data[i + 2]) / 3;

export function findInkBox(data: Uint8ClampedArray, width: number, height: number): InkBox | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (luminance(data, (y * width + x) * 4) < INK_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX < 0 ? null : { minX, minY, maxX, maxY };
}

export function toMnistInput(
  data: Uint8ClampedArray,
  width: number,
  height: number
): Float32Array | null {
  const box = findInkBox(data, width, height);
  if (!box) return null;

  const boxW = box.maxX - box.minX + 1;
  const boxH = box.maxY - box.minY + 1;
  const scale = INNER_BOX / Math.max(boxW, boxH);
  const drawW = Math.max(1, Math.round(boxW * scale));
  const drawH = Math.max(1, Math.round(boxH * scale));
  const offsetX = Math.floor((MNIST_SIZE - drawW) / 2);
  const offsetY = Math.floor((MNIST_SIZE - drawH) / 2);

  const input = new Float32Array(MNIST_SIZE * MNIST_SIZE);
  for (let dy = 0; dy < drawH; dy++) {
    const srcY = box.minY + Math.floor((dy / drawH) * boxH);
    for (let dx = 0; dx < drawW; dx++) {
      const srcX = box.minX + Math.floor((dx / drawW) * boxW);
      const lum = luminance(data, (srcY * width + srcX) * 4);
      const outX = offsetX + dx;
      const outY = offsetY + dy;
      input[outY * MNIST_SIZE + outX] = 255 - lum;
    }
  }
  return input;
}
