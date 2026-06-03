import React from 'react';
import { getAnswerInputComponent } from './adapter';
import type { AnswerInputProps } from './port';

export const useAnswerInput = (): React.FC<AnswerInputProps> =>
  React.useMemo(() => getAnswerInputComponent(), []);

export type { AnswerInputProps };
