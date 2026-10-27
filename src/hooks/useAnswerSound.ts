import { useEffect, useRef } from 'react';
import type { Answer } from '../types';
import { useSound } from './useSound';

export const useAnswerSound = (answer: Answer | null): void => {
  const play = useSound();
  const soundedQuestionIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!answer || soundedQuestionIdsRef.current.has(answer.question_id)) return;
    soundedQuestionIdsRef.current.add(answer.question_id);
    play(answer.is_correct ? 'correct' : 'wrong');
  }, [answer, play]);
};
