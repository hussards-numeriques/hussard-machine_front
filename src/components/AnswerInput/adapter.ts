import React from 'react';
import { HandwritingInput } from './HandwritingInput';
import { KeyboardInput } from './KeyboardInput';
import { KeypadInput } from './KeypadInput';
import type { ResolvedAnswerInputMode } from './mode';
import type { AnswerInputProps } from './port';

export const ANSWER_INPUT_COMPONENTS: Record<
  ResolvedAnswerInputMode,
  React.FC<AnswerInputProps>
> = {
  keyboard: KeyboardInput,
  handwriting: HandwritingInput,
  keypad: KeypadInput,
};
