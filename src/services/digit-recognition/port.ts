export interface DigitRecognitionPort {
  preload(): Promise<void>;
  recognizeNumber(canvas: HTMLCanvasElement): Promise<number | null>;
}
