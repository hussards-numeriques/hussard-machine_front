import { describe, expect, it } from 'vitest';
import { PARENTAL_GATE_QUESTIONS, isCorrectAnswer, pickQuestion } from './parentalGate';

const ww2End = PARENTAL_GATE_QUESTIONS.find((q) => q.answer === 1945)!;

describe('PARENTAL_GATE_QUESTIONS', () => {
  it('holds the ten agreed questions with distinct prompts', () => {
    const prompts = PARENTAL_GATE_QUESTIONS.map((q) => q.prompt);

    expect(PARENTAL_GATE_QUESTIONS).toHaveLength(10);
    expect(new Set(prompts).size).toBe(10);
  });
});

describe('isCorrectAnswer', () => {
  it.each(['1945', ' 1945 ', '1 945', '01945'])('accepts "%s"', (input) => {
    expect(isCorrectAnswer(ww2End, input)).toBe(true);
  });

  it.each(['', '1944', '1945.0', '1945a', '-1945', 'mille neuf cent'])('rejects "%s"', (input) => {
    expect(isCorrectAnswer(ww2End, input)).toBe(false);
  });
});

describe('pickQuestion', () => {
  it('picks the question matching the random draw', () => {
    expect(pickQuestion(undefined, () => 0)).toBe(PARENTAL_GATE_QUESTIONS[0]);
    expect(pickQuestion(undefined, () => 0.99)).toBe(PARENTAL_GATE_QUESTIONS[9]);
  });

  it('never picks the excluded question again', () => {
    const first = PARENTAL_GATE_QUESTIONS[0];

    expect(pickQuestion(first, () => 0)).not.toBe(first);
  });
});
