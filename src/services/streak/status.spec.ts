import { describe, expect, it } from 'vitest';
import { deriveStreakStatus } from './status';

const NOW = new Date('2026-06-22T10:00:00');

describe('deriveStreakStatus', () => {
  it('marks a played streak as secured (not at risk)', () => {
    const s = deriveStreakStatus(
      { current_count: 7, played_today: true, freeze_available_on: null },
      NOW
    );
    expect(s.isAlive).toBe(true);
    expect(s.atRisk).toBe(false);
    expect(s.lastChance).toBe(false);
    expect(s.freezeReady).toBe(true);
    expect(s.daysUntilFreeze).toBeNull();
  });

  it('flags soft risk when alive, not played today, freeze ready', () => {
    const s = deriveStreakStatus(
      { current_count: 5, played_today: false, freeze_available_on: null },
      NOW
    );
    expect(s.atRisk).toBe(true);
    expect(s.freezeReady).toBe(true);
    expect(s.lastChance).toBe(false);
  });

  it('flags last chance when alive, not played, freeze not ready, and counts days', () => {
    const s = deriveStreakStatus(
      { current_count: 5, played_today: false, freeze_available_on: '2026-06-28' },
      NOW
    );
    expect(s.lastChance).toBe(true);
    expect(s.freezeReady).toBe(false);
    expect(s.daysUntilFreeze).toBe(6);
  });

  it('treats count 0 as dead: not alive, not at risk', () => {
    const s = deriveStreakStatus(
      { current_count: 0, played_today: false, freeze_available_on: null },
      NOW
    );
    expect(s.isAlive).toBe(false);
    expect(s.atRisk).toBe(false);
    expect(s.lastChance).toBe(false);
  });

  it('clamps days to 0 when the freeze date is today or past', () => {
    const s = deriveStreakStatus(
      { current_count: 5, played_today: false, freeze_available_on: '2026-06-22' },
      NOW
    );
    expect(s.daysUntilFreeze).toBe(0);
  });
});
