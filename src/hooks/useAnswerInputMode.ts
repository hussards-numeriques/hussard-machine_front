import { useSyncExternalStore } from 'react';
import {
  DEFAULT_ANSWER_INPUT_MODE,
  isAnswerInputMode,
  type AnswerInputMode,
} from '../components/AnswerInput/mode';

export const ANSWER_INPUT_MODE_STORAGE_KEY = 'calc-rush:answer-input-mode';

const listeners = new Set<() => void>();

const readMode = (): AnswerInputMode => {
  const stored = localStorage.getItem(ANSWER_INPUT_MODE_STORAGE_KEY);
  return isAnswerInputMode(stored) ? stored : DEFAULT_ANSWER_INPUT_MODE;
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
};

const setMode = (mode: AnswerInputMode): void => {
  localStorage.setItem(ANSWER_INPUT_MODE_STORAGE_KEY, mode);
  listeners.forEach((listener) => listener());
};

export const useAnswerInputMode = (): readonly [
  AnswerInputMode,
  (mode: AnswerInputMode) => void,
] => {
  const mode = useSyncExternalStore(subscribe, readMode, () => DEFAULT_ANSWER_INPUT_MODE);
  return [mode, setMode] as const;
};
