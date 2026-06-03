export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
}

export interface DigitRecognitionPort {
  recognize(canvas: HTMLCanvasElement, strokes: Stroke[]): Promise<number | null>;
}
