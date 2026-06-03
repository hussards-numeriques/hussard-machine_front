import React from 'react';
import { HandwritingInput } from './HandwritingInput';
import { KeyboardInput } from './KeyboardInput';
import type { AnswerInputProps } from './port';

export const getAnswerInputComponent = (): React.FC<AnswerInputProps> => {
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  return isTouchDevice ? HandwritingInput : KeyboardInput;
};
