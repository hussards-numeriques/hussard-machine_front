import React from 'react';
import { getAnswerInputComponent } from './adapter';
import type { AnswerInputProps } from './port';

export const AnswerInput: React.FC<AnswerInputProps> = (props) => {
  const Component = getAnswerInputComponent();
  return React.createElement(Component, props);
};

export type { AnswerInputProps };
