export type SoundId =
  | 'correct'
  | 'wrong'
  | 'tick'
  | 'countdown'
  | 'go'
  | 'tap'
  | 'xp'
  | 'levelUp'
  | 'unlock'
  | 'victory'
  | 'finish';

export interface SoundNote {
  midi: number;
  startSeconds: number;
  durationSeconds: number;
  wave: OscillatorType;
  volume: number;
}

const A4_MIDI = 69;
const A4_FREQUENCY_HZ = 440;

export const midiToFrequency = (midi: number): number =>
  A4_FREQUENCY_HZ * 2 ** ((midi - A4_MIDI) / 12);

const G3 = 55;
const D4 = 62;
const G4 = 67;
const C5 = 72;
const E5 = 76;
const G5 = 79;
const C6 = 84;
const E6 = 88;
const G6 = 91;
const A6 = 93;
const C7 = 96;

const note = (
  midi: number,
  startSeconds: number,
  durationSeconds: number,
  volume: number,
  wave: OscillatorType = 'sine'
): SoundNote => ({ midi, startSeconds, durationSeconds, wave, volume });

const arpeggio = (
  midis: readonly number[],
  stepSeconds: number,
  durationSeconds: number,
  volume: number,
  wave: OscillatorType = 'sine'
): SoundNote[] =>
  midis.map((midi, index) => note(midi, index * stepSeconds, durationSeconds, volume, wave));

const GOURD_LOW_MIDI = 48;
const GOURD_HIGH_MIDI = 62;
const GOURD_BLOP_STEP_SECONDS = 0.07;
const GOURD_BLOP_DURATION_SECONDS = 0.14;
const GOURD_MIN_BLOPS = 3;
const GOURD_MAX_BLOPS = 16;

export const xpBlopCount = (gainedXp: number, experiencePerGrade: number): number => {
  const share = Math.min(1, Math.max(0, gainedXp / experiencePerGrade));
  return GOURD_MIN_BLOPS + Math.round(share * (GOURD_MAX_BLOPS - GOURD_MIN_BLOPS));
};

export const xpFillNotes = (blopCount: number): readonly SoundNote[] =>
  Array.from({ length: blopCount }, (_, index) => {
    const fillRatio = blopCount > 1 ? index / (blopCount - 1) : 0;
    const midi = GOURD_LOW_MIDI + Math.round(fillRatio * (GOURD_HIGH_MIDI - GOURD_LOW_MIDI));
    return note(midi, index * GOURD_BLOP_STEP_SECONDS, GOURD_BLOP_DURATION_SECONDS, 0.4);
  });

export type Sound = SoundId | readonly SoundNote[];

export const SOUND_NOTES: Record<SoundId, readonly SoundNote[]> = {
  correct: [
    note(E6, 0, 0.22, 0.5, 'triangle'),
    note(E6 + 12, 0, 0.12, 0.08),
    note(A6, 0.09, 0.4, 0.55, 'triangle'),
    note(A6 + 12, 0.09, 0.2, 0.1),
  ],
  wrong: [note(G3 + 12, 0, 0.18, 0.45, 'triangle'), note(G3 + 5, 0.13, 0.32, 0.45, 'triangle')],
  tick: [note(C7, 0, 0.05, 0.18)],
  countdown: [note(E5, 0, 0.14, 0.4, 'triangle')],
  go: [
    note(C5, 0, 0.5, 0.3, 'triangle'),
    note(E5, 0, 0.5, 0.3, 'triangle'),
    note(G5, 0, 0.5, 0.3, 'triangle'),
    note(C6, 0, 0.6, 0.35, 'triangle'),
    note(G6, 0.04, 0.6, 0.15),
  ],
  tap: [note(G5, 0, 0.04, 0.2, 'triangle')],
  xp: xpFillNotes(GOURD_MAX_BLOPS),
  levelUp: [
    ...arpeggio([G4, C5, E5, G5, C6, E6, G6], 0.07, 0.35, 0.3, 'triangle'),
    note(C6, 0.55, 0.9, 0.3, 'triangle'),
    note(E6, 0.55, 0.9, 0.25, 'triangle'),
    note(G6, 0.55, 0.9, 0.25, 'triangle'),
    note(C7, 0.6, 0.9, 0.12),
  ],
  unlock: [note(E6, 0, 0.9, 0.4), note(E6 + 7, 0.04, 0.8, 0.2), note(C7, 0.12, 0.9, 0.25)],
  victory: [
    ...arpeggio([C5, E5, G5, C6], 0.12, 0.3, 0.35, 'triangle'),
    note(C5, 0.5, 1, 0.25, 'triangle'),
    note(E5, 0.5, 1, 0.25, 'triangle'),
    note(G5, 0.5, 1, 0.25, 'triangle'),
    note(C6, 0.5, 1.1, 0.3, 'triangle'),
    note(G6, 0.55, 0.9, 0.12),
  ],
  finish: [note(G4, 0, 0.25, 0.35, 'triangle'), note(D4 + 12, 0.14, 0.5, 0.35, 'triangle')],
};

export const soundDurationSeconds = (id: SoundId): number =>
  Math.max(...SOUND_NOTES[id].map((n) => n.startSeconds + n.durationSeconds));
