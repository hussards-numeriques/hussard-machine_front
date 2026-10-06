import i18n from '../i18n';

type ParentalGateQuestionId =
  | 'ww2End'
  | 'ww2Start'
  | 'ww1Start'
  | 'ww1Armistice'
  | 'moonLanding'
  | 'berlinWall'
  | 'leapYearDays'
  | 'footballPlayers'
  | 'chessSquares'
  | 'centimetersInMeter';

export interface ParentalGateQuestion {
  readonly prompt: string;
  readonly answer: number;
}

const question = (id: ParentalGateQuestionId, answer: number): ParentalGateQuestion => ({
  get prompt() {
    return i18n.t(`parentalGate.questions.${id}`);
  },
  answer,
});

export const PARENTAL_GATE_QUESTIONS: readonly ParentalGateQuestion[] = [
  question('ww2End', 1945),
  question('ww2Start', 1939),
  question('ww1Start', 1914),
  question('ww1Armistice', 1918),
  question('moonLanding', 1969),
  question('berlinWall', 1989),
  question('leapYearDays', 366),
  question('footballPlayers', 11),
  question('chessSquares', 64),
  question('centimetersInMeter', 100),
];

const DIGITS_ONLY = /^\d+$/;

export const isCorrectAnswer = (question: ParentalGateQuestion, input: string): boolean => {
  const digits = input.replace(/\s/g, '');
  return DIGITS_ONLY.test(digits) && Number(digits) === question.answer;
};

export const pickQuestion = (
  exclude?: ParentalGateQuestion,
  random: () => number = Math.random
): ParentalGateQuestion => {
  const candidates = PARENTAL_GATE_QUESTIONS.filter((candidate) => candidate !== exclude);
  return candidates[Math.floor(random() * candidates.length)];
};
