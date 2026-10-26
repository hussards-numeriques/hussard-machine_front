import { describe, it, expect } from 'vitest';
import { SOUND_NOTES, midiToFrequency, soundDurationSeconds, type SoundId } from './sounds';

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
