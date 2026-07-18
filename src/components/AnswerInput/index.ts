import React from 'react';
import { useAnswerInputMode } from '../../hooks/useAnswerInputMode';
import { ANSWER_INPUT_COMPONENTS } from './adapter';
import { resolveAnswerInputMode } from './mode';
import type { AnswerInputProps } from './port';

export const AnswerInput: React.FC<AnswerInputProps> = (props) => {
  const [mode] = useAnswerInputMode();
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const Component = ANSWER_INPUT_COMPONENTS[resolveAnswerInputMode(mode, isCoarsePointer)];
  return React.createElement(Component, props);
};

export type { AnswerInputProps };
