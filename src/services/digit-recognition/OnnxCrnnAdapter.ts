import type { DigitRecognitionPort } from './port';
import { toCrnnInput, CRNN_HEIGHT, CRNN_WIDTH } from './preprocessing';

const MODEL_URL = '/models/crnn-digits.onnx';
const INPUT_NAME = 'input';
const OUTPUT_NAME = 'logits';
const NUM_CLASSES = 11;
const BLANK = 10;

type Ort = typeof import('onnxruntime-web');
type Session = Awaited<ReturnType<Ort['InferenceSession']['create']>>;

/**
 * Décodage CTC greedy : à chaque timestep on prend la classe argmax, on fusionne
 * les répétitions consécutives et on ignore le blank. Le layout de `logits` est
 * [T, 1, C] aplati en ligne, donc l'index de la classe c au timestep t est
 * t * numClasses + c.
 */
export const decodeCtc = (
  logits: Float32Array,
  timesteps: number,
  numClasses: number
): number | null => {
  const digits: number[] = [];
  let previous = -1;
  for (let t = 0; t < timesteps; t++) {
    let best = 0;
    for (let c = 1; c < numClasses; c++) {
      if (logits[t * numClasses + c] > logits[t * numClasses + best]) best = c;
    }
    if (best !== previous && best !== BLANK) digits.push(best);
    previous = best;
  }
  return digits.length ? parseInt(digits.join(''), 10) : null;
};

export class OnnxCrnnAdapter implements DigitRecognitionPort {
  private ort: Ort | null = null;
  private session: Session | null = null;
  private loadPromise: Promise<void> | null = null;

  private async ensureLoaded(): Promise<void> {
    if (this.session) return;
    this.loadPromise ??= (async () => {
      this.ort = await import('onnxruntime-web');
      this.session = await this.ort.InferenceSession.create(MODEL_URL);
    })().catch((err: unknown) => {
      this.loadPromise = null;
      throw err;
    });
    return this.loadPromise;
  }

  async recognizeNumber(canvas: HTMLCanvasElement): Promise<number | null> {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const input = toCrnnInput(data, canvas.width, canvas.height);
    if (!input) return null;

    await this.ensureLoaded();
    const ort = this.ort!;
    const tensor = new ort.Tensor('float32', input, [1, 1, CRNN_HEIGHT, CRNN_WIDTH]);
    const results = await this.session!.run({ [INPUT_NAME]: tensor });
    const logits = results[OUTPUT_NAME].data as Float32Array;
    const timesteps = logits.length / NUM_CLASSES;
    return decodeCtc(logits, timesteps, NUM_CLASSES);
  }
}
