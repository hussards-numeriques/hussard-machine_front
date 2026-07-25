export const CRNN_HEIGHT = 32;
export const CRNN_WIDTH = 128;
const INK_THRESHOLD_LUM = 200; // luminance : encre si < seuil (bbox côté canvas)
const INK_THRESHOLD_HIGH = 0.2; // échelle ink-haut 0-1 (miroir de preprocess_ink)

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
      if (luminance(data, (y * width + x) * 4) < INK_THRESHOLD_LUM) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX < 0 ? null : { minX, minY, maxX, maxY };
}

/** (m, n) : ligne j = couverture fractionnaire de la sortie j sur l'entrée, normalisée. */
function areaWeights(n: number, m: number): Float64Array[] {
  const rows: Float64Array[] = [];
  const scale = n / m;
  for (let j = 0; j < m; j++) {
    const row = new Float64Array(n);
    const start = j * scale;
    const end = Math.min((j + 1) * scale, n); // cap à n : évite un débordement dû à l'arrondi flottant (parité avec Python)
    let total = 0;
    for (let i = Math.floor(start); i < end; i++) {
      const lo = Math.max(i, start);
      const hi = Math.min(i + 1, end);
      row[i] = hi - lo;
      total += hi - lo;
    }
    if (total > 0) for (let i = 0; i < n; i++) row[i] /= total;
    rows.push(row);
  }
  return rows;
}

/** Resize 2D séparable par moyennage d'aire (hauteur puis largeur). */
function resizeArea(
  img: Float64Array,
  h: number,
  w: number,
  outH: number,
  outW: number
): Float64Array {
  const wr = areaWeights(h, outH);
  const wc = areaWeights(w, outW);
  // étape hauteur : (outH x w)
  const tmp = new Float64Array(outH * w);
  for (let i = 0; i < outH; i++) {
    const wri = wr[i];
    for (let a = 0; a < h; a++) {
      const coef = wri[a];
      if (coef === 0) continue;
      for (let b = 0; b < w; b++) tmp[i * w + b] += coef * img[a * w + b];
    }
  }
  // étape largeur : (outH x outW)
  const out = new Float64Array(outH * outW);
  for (let i = 0; i < outH; i++) {
    for (let j = 0; j < outW; j++) {
      const wcj = wc[j];
      let s = 0;
      for (let b = 0; b < w; b++) s += tmp[i * w + b] * wcj[b];
      out[i * outW + j] = s;
    }
  }
  return out;
}

/**
 * Miroir exact de `preprocess_ink` (Python). Entrée : `ink` en ink-haut 0-1
 * (encre = 1, fond = 0), dimensions width x height. Sortie : Float32Array 32*128.
 */
export function preprocessInkHigh(ink: Float32Array, width: number, height: number): Float32Array {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (ink[y * width + x] > INK_THRESHOLD_HIGH) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const out = new Float32Array(CRNN_HEIGHT * CRNN_WIDTH);
  if (maxX < 0) return out;

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;
  const crop = new Float64Array(boxH * boxW);
  for (let y = 0; y < boxH; y++)
    for (let x = 0; x < boxW; x++) crop[y * boxW + x] = ink[(minY + y) * width + (minX + x)];

  const drawW = Math.max(1, Math.min(CRNN_WIDTH, Math.round((boxW * CRNN_HEIGHT) / boxH)));
  const resized = resizeArea(crop, boxH, boxW, CRNN_HEIGHT, drawW);
  const off = Math.floor((CRNN_WIDTH - drawW) / 2);
  for (let y = 0; y < CRNN_HEIGHT; y++)
    for (let x = 0; x < drawW; x++) {
      const v = resized[y * drawW + x];
      out[y * CRNN_WIDTH + (off + x)] = v < 0 ? 0 : v > 1 ? 1 : v;
    }
  return out;
}

/** Canvas ImageData -> tenseur d'entrée CRNN, via le prétraitement canonique partagé. */
export function toCrnnInput(
  data: Uint8ClampedArray,
  width: number,
  height: number
): Float32Array | null {
  const ink = new Float32Array(width * height);
  let hasInk = false;
  for (let p = 0; p < width * height; p++) {
    const v = (255 - luminance(data, p * 4)) / 255; // ink-haut 0-1
    ink[p] = v;
    if (v > INK_THRESHOLD_HIGH) hasInk = true;
  }
  if (!hasInk) return null;
  return preprocessInkHigh(ink, width, height);
}
