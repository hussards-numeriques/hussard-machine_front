export interface DigitRecognitionPort {
  recognizeDigit(canvas: HTMLCanvasElement): Promise<number | null>;
}
