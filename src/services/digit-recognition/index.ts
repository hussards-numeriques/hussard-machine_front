import { TfjsMnistAdapter } from './TfjsMnistAdapter';
import type { DigitRecognitionPort } from './port';

export const digitRecognitionPort: DigitRecognitionPort = new TfjsMnistAdapter();
export type { DigitRecognitionPort };
