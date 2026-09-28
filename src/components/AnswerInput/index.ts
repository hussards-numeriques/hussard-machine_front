import React from 'react';
import { useResolvedAnswerInputMode } from '../../hooks/useAnswerInputMode';
import { ANSWER_INPUT_COMPONENTS } from './adapter';
import type { AnswerInputProps } from './port';

export const AnswerInput: React.FC<AnswerInputProps> = (props) => {
  const Component = ANSWER_INPUT_COMPONENTS[useResolvedAnswerInputMode()];
  return React.createElement(Component, props);
};

export type { AnswerInputProps };
