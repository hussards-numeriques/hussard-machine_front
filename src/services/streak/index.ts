import { HttpStreakAdapter } from './HttpStreakAdapter';
import type { StreakRepository } from './port';

export const streakRepository: StreakRepository = new HttpStreakAdapter();
export type { StreakRepository, StreakResponse, AuthorizedFetch } from './port';
