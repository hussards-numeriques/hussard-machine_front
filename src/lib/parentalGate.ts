export interface ParentalGateQuestion {
  prompt: string;
  answer: number;
}

export const PARENTAL_GATE_QUESTIONS: readonly ParentalGateQuestion[] = [
  { prompt: 'En quelle année s’est terminée la Seconde Guerre mondiale ?', answer: 1945 },
  { prompt: 'En quelle année a commencé la Seconde Guerre mondiale ?', answer: 1939 },
  { prompt: 'En quelle année a commencé la Première Guerre mondiale ?', answer: 1914 },
  {
    prompt: 'En quelle année a été signé l’armistice de la Première Guerre mondiale ?',
    answer: 1918,
  },
  { prompt: 'À quel âge devient-on majeur en France ?', answer: 18 },
  { prompt: 'Quel est le numéro du département de Paris ?', answer: 75 },
  { prompt: 'Quel numéro appelle-t-on pour joindre le SAMU ?', answer: 15 },
  { prompt: 'Quelle est la vitesse maximale en ville, en km/h ?', answer: 50 },
  { prompt: 'Quel numéro appelle-t-on pour joindre les pompiers ?', answer: 18 },
  { prompt: 'Combien de centimes y a-t-il dans un euro ?', answer: 100 },
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
  const candidates = PARENTAL_GATE_QUESTIONS.filter((question) => question !== exclude);
  return candidates[Math.floor(random() * candidates.length)];
};
