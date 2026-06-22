import type { StreakResponse } from './port';

export interface StreakStatus {
  count: number;
  isAlive: boolean;
  freezeReady: boolean;
  atRisk: boolean;
  lastChance: boolean;
  daysUntilFreeze: number | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const atMidnight = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const daysUntil = (dateStr: string, now: Date): number => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(year, month - 1, day).getTime();
  const diff = Math.round((target - atMidnight(now)) / MS_PER_DAY);
  return diff > 0 ? diff : 0;
};

export function deriveStreakStatus(streak: StreakResponse, now: Date = new Date()): StreakStatus {
  const isAlive = streak.current_count > 0;
  const freezeReady = streak.freeze_available_on === null;
  const atRisk = isAlive && !streak.played_today;
  const lastChance = atRisk && !freezeReady;
  const daysUntilFreeze =
    streak.freeze_available_on === null ? null : daysUntil(streak.freeze_available_on, now);

  return {
    count: streak.current_count,
    isAlive,
    freezeReady,
    atRisk,
    lastChance,
    daysUntilFreeze,
  };
}
