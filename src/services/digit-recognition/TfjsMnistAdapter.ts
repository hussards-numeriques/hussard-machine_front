import type { DigitRecognitionPort, Stroke } from './port';
import { segmentStrokes, isMinusSign } from './segmentation';
import type { DigitRegion } from './segmentation';

const MODEL_URL = 'https://storage.googleapis.com/tfjs-examples/mnist-transfer-cnn/dist/model.json';
const DIGIT_SIZE = 28;
const PADDING = 4;

export class TfjsMnistAdapter implements DigitRecognitionPort {
  private model: Awaited<
    ReturnType<(typeof import('@tensorflow/tfjs'))['loadLayersModel']>
  > | null = null;
  private tf: typeof import('@tensorflow/tfjs') | null = null;

  private async ensureLoaded(): Promise<void> {
    if (this.model) return;
    this.tf = await import('@tensorflow/tfjs');
    this.model = await this.tf.loadLayersModel(MODEL_URL);
  }

  private renderRegion(region: DigitRegion): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = DIGIT_SIZE;
    canvas.height = DIGIT_SIZE;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, DIGIT_SIZE, DIGIT_SIZE);

    const { minX, maxX, minY, maxY } = region.box;
    const boxW = maxX - minX || 1;
    const boxH = maxY - minY || 1;
    const scale = Math.min((DIGIT_SIZE - PADDING * 2) / boxW, (DIGIT_SIZE - PADDING * 2) / boxH);
    const dx = PADDING + (DIGIT_SIZE - PADDING * 2 - boxW * scale) / 2 - minX * scale;
    const dy = PADDING + (DIGIT_SIZE - PADDING * 2 - boxH * scale) / 2 - minY * scale;

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of region.strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * scale + dx, stroke.points[0].y * scale + dy);
      for (const pt of stroke.points.slice(1)) {
        ctx.lineTo(pt.x * scale + dx, pt.y * scale + dy);
      }
      ctx.stroke();
    }

    return canvas;
  }

  private predictDigit(digitCanvas: HTMLCanvasElement): number {
    const tf = this.tf!;
    return tf.tidy(() => {
      const img = tf.browser.fromPixels(digitCanvas, 1);
      const normalized = tf.scalar(1).sub(img.toFloat().div(255));
      const batched = normalized.expandDims(0);
      const prediction = this.model!.predict(batched) as ReturnType<typeof tf.tensor>;
      return Array.from(prediction.argMax(1).dataSync())[0];
    });
  }

  async recognize(canvas: HTMLCanvasElement, strokes: Stroke[]): Promise<number | null> {
    if (strokes.length === 0) return null;
    await this.ensureLoaded();

    const regions = segmentStrokes(strokes);
    if (regions.length === 0) return null;

    let isNegative = false;
    let digitRegions = regions;

    if (regions.length > 1 && isMinusSign(regions[0], canvas.width)) {
      isNegative = true;
      digitRegions = regions.slice(1);
    }

    const digits: number[] = [];
    for (const region of digitRegions) {
      const digitCanvas = this.renderRegion(region);
      digits.push(this.predictDigit(digitCanvas));
    }

    if (digits.length === 0) return null;

    const value = parseInt(digits.join(''), 10);
    return isNaN(value) ? null : isNegative ? -value : value;
  }
}
