import type { DigitRecognitionPort } from './port';
import { toMnistInput, MNIST_SIZE } from './preprocessing';

const MODEL_URL = '/models/mnist-12.onnx';
const INPUT_NAME = 'Input3';
const OUTPUT_NAME = 'Plus214_Output_0';

type Ort = typeof import('onnxruntime-web');
type Session = Awaited<ReturnType<Ort['InferenceSession']['create']>>;

const argMax = (values: Float32Array): number => {
  let best = 0;
  for (let i = 1; i < values.length; i++) if (values[i] > values[best]) best = i;
  return best;
};

export class OnnxMnistAdapter implements DigitRecognitionPort {
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

  async recognizeDigit(canvas: HTMLCanvasElement): Promise<number | null> {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const input = toMnistInput(data, canvas.width, canvas.height);
    if (!input) return null;

    await this.ensureLoaded();
    const ort = this.ort!;
    const tensor = new ort.Tensor('float32', input, [1, 1, MNIST_SIZE, MNIST_SIZE]);
    const results = await this.session!.run({ [INPUT_NAME]: tensor });
    const logits = results[OUTPUT_NAME].data as Float32Array;
    return argMax(logits);
  }
}
