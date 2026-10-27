import { describe, it, expect } from 'vitest';
import {
  SOUND_NOTES,
  midiToFrequency,
  soundDurationSeconds,
  xpBlopCount,
  xpFillNotes,
  type SoundId,
} from './sounds';

const SOUND_IDS = Object.keys(SOUND_NOTES) as SoundId[];

describe('midiToFrequency', () => {
  it('maps A4 to 440 Hz', () => {
    expect(midiToFrequency(69)).toBe(440);
  });

  it('doubles the frequency one octave up', () => {
    expect(midiToFrequency(81)).toBeCloseTo(880);
  });
});

describe('SOUND_NOTES', () => {
  it.each(SOUND_IDS)('%s has at least one well-formed note', (id) => {
    const notes = SOUND_NOTES[id];
    expect(notes.length).toBeGreaterThan(0);
    notes.forEach((n) => {
      expect(n.startSeconds).toBeGreaterThanOrEqual(0);
      expect(n.durationSeconds).toBeGreaterThan(0);
      expect(n.volume).toBeGreaterThan(0);
      expect(n.volume).toBeLessThanOrEqual(1);
      expect(midiToFrequency(n.midi)).toBeLessThan(20000);
    });
  });

  it.each(SOUND_IDS)('%s stays short enough to feel like feedback', (id) => {
    expect(soundDurationSeconds(id)).toBeLessThan(2);
  });

  it('keeps the tick shorter than the correct jingle', () => {
    expect(soundDurationSeconds('tick')).toBeLessThan(soundDurationSeconds('correct'));
  });
});

describe('xpBlopCount', () => {
  it('gives a handful of blops for a tiny gain', () => {
    expect(xpBlopCount(1, 100)).toBe(3);
  });

  it('gives more blops the more XP was gained', () => {
    expect(xpBlopCount(60, 100)).toBeGreaterThan(xpBlopCount(20, 100));
  });

  it('caps the blops once a whole grade worth of XP is gained', () => {
    expect(xpBlopCount(100, 100)).toBe(xpBlopCount(500, 100));
  });
});

describe('xpFillNotes', () => {
  it('plays exactly the requested number of blops, rising in pitch', () => {
    const notes = xpFillNotes(6);
    expect(notes).toHaveLength(6);
    const midis = notes.map((n) => n.midi);
    expect(midis).toEqual([...midis].sort((a, b) => a - b));
  });

  it('always starts and ends on the same pitches whatever the count', () => {
    const few = xpFillNotes(3);
    const many = xpFillNotes(12);
    expect(few[0].midi).toBe(many[0].midi);
    expect(few[few.length - 1].midi).toBe(many[many.length - 1].midi);
  });
});
