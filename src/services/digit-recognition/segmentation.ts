import type { Stroke } from './port';

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface DigitRegion {
  strokes: Stroke[];
  box: BoundingBox;
}

const strokeBox = (stroke: Stroke): BoundingBox => {
  const xs = stroke.points.map((p) => p.x);
  const ys = stroke.points.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
};

const mergeBoxes = (a: BoundingBox, b: BoundingBox): BoundingBox => ({
  minX: Math.min(a.minX, b.minX),
  maxX: Math.max(a.maxX, b.maxX),
  minY: Math.min(a.minY, b.minY),
  maxY: Math.max(a.maxY, b.maxY),
});

const overlapsHorizontally = (a: BoundingBox, b: BoundingBox): boolean =>
  a.minX <= b.maxX && b.minX <= a.maxX;

export const segmentStrokes = (strokes: Stroke[]): DigitRegion[] => {
  if (strokes.length === 0) return [];

  const regions: DigitRegion[] = strokes.map((stroke) => ({
    strokes: [stroke],
    box: strokeBox(stroke),
  }));

  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        if (overlapsHorizontally(regions[i].box, regions[j].box)) {
          regions[i] = {
            strokes: [...regions[i].strokes, ...regions[j].strokes],
            box: mergeBoxes(regions[i].box, regions[j].box),
          };
          regions.splice(j, 1);
          merged = true;
          break outer;
        }
      }
    }
  }

  return regions.sort((a, b) => a.box.minX - b.box.minX);
};

export const isMinusSign = (region: DigitRegion, canvasWidth: number): boolean => {
  const width = region.box.maxX - region.box.minX;
  const height = region.box.maxY - region.box.minY;
  return height < width * 0.3 && width > canvasWidth * 0.05;
};
