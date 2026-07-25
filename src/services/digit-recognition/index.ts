import { OnnxCrnnAdapter } from './OnnxCrnnAdapter';
import type { DigitRecognitionPort } from './port';

export const digitRecognitionPort: DigitRecognitionPort = new OnnxCrnnAdapter();
export type { DigitRecognitionPort };
