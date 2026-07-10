export const GRADES = ['BRONZE', 'SILVER', 'GOLD', 'PLATINE', 'DIAMOND'] as const;
export type Grade = (typeof GRADES)[number];

export const LEVELS = [
  'CP',
  'CE1',
  'CE2',
  'CM1',
  'CM2',
  'SIXIEME',
  'CINQUIEME',
  'QUATRIEME',
  'TROISIEME',
  'SECONDE',
  'PREMIERE',
  'TERMINALE',
] as const;
export type Level = (typeof LEVELS)[number];

const GRADE_LABELS: Record<Grade, string> = {
  BRONZE: 'Bronze',
  SILVER: 'Argent',
  GOLD: 'Or',
  PLATINE: 'Platine',
  DIAMOND: 'Diamant',
};

const GRADE_STYLES: Record<Grade, string> = {
  BRONZE: 'bg-amber-100 text-amber-800 border-amber-300',
  SILVER: 'bg-slate-100 text-slate-600 border-slate-300',
  GOLD: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  PLATINE: 'bg-violet-100 text-violet-700 border-violet-300',
  DIAMOND: 'bg-cyan-100 text-cyan-700 border-cyan-300',
};

const GRADE_BAR_COLORS: Record<Grade, string> = {
  BRONZE: 'bg-amber-400',
  SILVER: 'bg-slate-400',
  GOLD: 'bg-yellow-400',
  PLATINE: 'bg-violet-400',
  DIAMOND: 'bg-cyan-400',
};

const GRADE_RING_COLORS: Record<Grade, string> = {
  BRONZE: 'ring-amber-400',
  SILVER: 'ring-slate-400',
  GOLD: 'ring-yellow-400',
  PLATINE: 'ring-violet-500',
  DIAMOND: 'ring-cyan-400',
};

const LEVEL_LABELS: Record<Level, string> = {
  CP: 'CP',
  CE1: 'CE1',
  CE2: 'CE2',
  CM1: 'CM1',
  CM2: 'CM2',
  SIXIEME: '6ème',
  CINQUIEME: '5ème',
  QUATRIEME: '4ème',
  TROISIEME: '3ème',
  SECONDE: 'Seconde',
  PREMIERE: '1ère',
  TERMINALE: 'Terminale',
};

export const DEFAULT_GRADE_STYLE = 'bg-slate-100 text-slate-600 border-slate-300';

export const DEFAULT_GRADE_RING = 'ring-slate-300';

const isGrade = (value: string): value is Grade => (GRADES as readonly string[]).includes(value);

const isLevel = (value: string): value is Level => (LEVELS as readonly string[]).includes(value);

export const resolveGradeLabel = (grade: string): string =>
  isGrade(grade) ? GRADE_LABELS[grade] : grade;

export const resolveGradeStyle = (grade: string): string =>
  isGrade(grade) ? GRADE_STYLES[grade] : DEFAULT_GRADE_STYLE;

export const resolveGradeBarColor = (grade: string): string =>
  isGrade(grade) ? GRADE_BAR_COLORS[grade] : 'bg-primary';

export const resolveGradeRingColor = (grade: string): string =>
  isGrade(grade) ? GRADE_RING_COLORS[grade] : DEFAULT_GRADE_RING;

export const resolveLevelLabel = (level: string): string =>
  isLevel(level) ? LEVEL_LABELS[level] : level;
