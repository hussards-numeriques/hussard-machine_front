import { OnnxMnistAdapter } from './OnnxMnistAdapter';
import type { DigitRecognitionPort } from './port';

export const digitRecognitionPort: DigitRecognitionPort = new OnnxMnistAdapter();
export type { DigitRecognitionPort };
