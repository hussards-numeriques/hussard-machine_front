export type AnswerInputMode = 'auto' | 'keyboard' | 'handwriting' | 'keypad';
export type ResolvedAnswerInputMode = 'keyboard' | 'handwriting' | 'keypad';

export const DEFAULT_ANSWER_INPUT_MODE: AnswerInputMode = 'auto';

export const ANSWER_INPUT_MODES: readonly AnswerInputMode[] = [
  'auto',
  'keyboard',
  'handwriting',
  'keypad',
];

export const isAnswerInputMode = (value: unknown): value is AnswerInputMode =>
  typeof value === 'string' && (ANSWER_INPUT_MODES as readonly string[]).includes(value);

export const resolveAnswerInputMode = (
  mode: AnswerInputMode,
  isCoarsePointer: boolean
): ResolvedAnswerInputMode => {
  if (mode === 'auto') return isCoarsePointer ? 'handwriting' : 'keyboard';
  return mode;
};
