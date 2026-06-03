import { describe, it, expect } from 'vitest';
import { segmentStrokes, isMinusSign } from './segmentation';

describe('segmentStrokes', () => {
  it('returns empty array for no strokes', () => {
    expect(segmentStrokes([])).toEqual([]);
  });

  it('groups horizontally overlapping strokes into one region', () => {
    const strokes = [
      {
        points: [
          { x: 10, y: 10 },
          { x: 20, y: 20 },
        ],
      },
      {
        points: [
          { x: 15, y: 30 },
          { x: 25, y: 40 },
        ],
      },
    ];
    const result = segmentStrokes(strokes);
    expect(result).toHaveLength(1);
    expect(result[0].strokes).toHaveLength(2);
  });

  it('separates horizontally non-overlapping strokes', () => {
    const strokes = [
      {
        points: [
          { x: 0, y: 10 },
          { x: 20, y: 20 },
        ],
      },
      {
        points: [
          { x: 50, y: 10 },
          { x: 70, y: 20 },
        ],
      },
    ];
    const result = segmentStrokes(strokes);
    expect(result).toHaveLength(2);
  });

  it('sorts regions left to right', () => {
    const strokes = [
      {
        points: [
          { x: 80, y: 10 },
          { x: 90, y: 20 },
        ],
      },
      {
        points: [
          { x: 10, y: 10 },
          { x: 20, y: 20 },
        ],
      },
    ];
    const result = segmentStrokes(strokes);
    expect(result[0].box.minX).toBe(10);
    expect(result[1].box.minX).toBe(80);
  });
});

describe('isMinusSign', () => {
  it('detects a wide flat stroke as minus sign', () => {
    const region = {
      strokes: [
        {
          points: [
            { x: 10, y: 50 },
            { x: 90, y: 52 },
          ],
        },
      ],
      box: { minX: 10, maxX: 90, minY: 50, maxY: 52 },
    };
    expect(isMinusSign(region, 200)).toBe(true);
  });

  it('does not detect a tall stroke as minus sign', () => {
    const region = {
      strokes: [
        {
          points: [
            { x: 10, y: 10 },
            { x: 20, y: 80 },
          ],
        },
      ],
      box: { minX: 10, maxX: 20, minY: 10, maxY: 80 },
    };
    expect(isMinusSign(region, 200)).toBe(false);
  });
});
