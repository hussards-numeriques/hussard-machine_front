export type AnswerInputMode = 'auto' | 'keyboard' | 'handwriting' | 'keypad';
export type ResolvedAnswerInputMode = 'keyboard' | 'handwriting' | 'keypad';

export const DEFAULT_ANSWER_INPUT_MODE: AnswerInputMode = 'auto';

export const ANSWER_INPUT_MODES: readonly AnswerInputMode[] = [
  'auto',
  'keyboard',
  'handwriting',
  'keypad',
];

export const ANSWER_INPUT_MODE_LABELS: Record<AnswerInputMode, string> = {
  auto: 'Automatique',
  keyboard: 'Clavier',
  handwriting: 'Écriture manuscrite',
  keypad: 'Pavé numérique',
};

export const ANSWER_INPUT_MODE_DESCRIPTIONS: Record<AnswerInputMode, string> = {
  auto: 'Choisit automatiquement selon ton appareil : manuscrit sur tactile, clavier sinon.',
  keyboard: 'Champ de saisie classique, ouvre le clavier de ton appareil.',
  handwriting: 'Dessine le chiffre, il est reconnu automatiquement.',
  keypad: "Un pavé de chiffres à l'écran, sans clavier.",
};

export const isAnswerInputMode = (value: unknown): value is AnswerInputMode =>
  typeof value === 'string' && (ANSWER_INPUT_MODES as readonly string[]).includes(value);

export const resolveAnswerInputMode = (
  mode: AnswerInputMode,
  isCoarsePointer: boolean
): ResolvedAnswerInputMode => {
  if (mode === 'auto') return isCoarsePointer ? 'handwriting' : 'keyboard';
  return mode;
};
