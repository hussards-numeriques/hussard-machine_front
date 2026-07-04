import type { GameConfig } from '../types';

export interface GradeSegment {
  grade: string;
  fillPercent: number;
  isCurrent: boolean;
}

export interface GradeProgress {
  gradeIndex: number;
  nextGrade: string | null;
  xpToNextGrade: number;
  segments: GradeSegment[];
}

export const computeGradeProgress = (
  experience: number,
  canPromote: boolean,
  config: GameConfig
): GradeProgress => {
  const gradeIndex = Math.min(
    Math.floor(experience / config.experience_per_grade),
    config.grades.length - 1
  );
  const progressInGrade = canPromote
    ? config.experience_per_grade
    : experience % config.experience_per_grade;

  const segments = config.grades.map((grade, i) => {
    let fillPercent = 0;
    if (i < gradeIndex) {
      fillPercent = 100;
    } else if (i === gradeIndex) {
      fillPercent = (progressInGrade / config.experience_per_grade) * 100;
    }
    return { grade, fillPercent, isCurrent: i === gradeIndex };
  });

  return {
    gradeIndex,
    nextGrade: config.grades[gradeIndex + 1] ?? null,
    xpToNextGrade: config.experience_per_grade - progressInGrade,
    segments,
  };
};
