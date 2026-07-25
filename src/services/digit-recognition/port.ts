export interface DigitRecognitionPort {
  recognizeNumber(canvas: HTMLCanvasElement): Promise<number | null>;
}
