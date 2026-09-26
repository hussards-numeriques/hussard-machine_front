import { describe, expect, it } from 'vitest';
import { resolveTitlesLevelView } from './titlesLevelView';
import type { MyTitlesResponse } from '../services/quests';

const baseResponse: MyTitlesResponse = {
  level: 'CM1',
  current_level: 'CM1',
  selected_title_id: null,
  titles: [],
  quests: [
    { id: 'win-streak', label: "Terminer 1er en parties d'affilée", progress: 0, tiers: [] },
  ],
};

describe('resolveTitlesLevelView', () => {
  it('returns active when level equals current_level, even with no progress', () => {
    expect(resolveTitlesLevelView(baseResponse)).toEqual({ kind: 'active', level: 'CM1' });
  });

  it('returns inactive-memories when a title is unlocked', () => {
    const response: MyTitlesResponse = {
      ...baseResponse,
      level: 'CE1',
      current_level: 'CM1',
      titles: [
        {
          id: 'win-streak-bronze',
          label: 'Petit Conquérant',
          rarity: 'BRONZE',
          unlocked_at: '2026-01-01',
        },
      ],
    };

    expect(resolveTitlesLevelView(response)).toEqual({
      kind: 'inactive-memories',
      level: 'CE1',
      currentLevel: 'CM1',
    });
  });

  it('returns inactive-memories when no title but a quest has progress', () => {
    const response: MyTitlesResponse = {
      ...baseResponse,
      level: 'CE1',
      current_level: 'CM1',
      quests: [
        { id: 'win-streak', label: "Terminer 1er en parties d'affilée", progress: 1, tiers: [] },
      ],
    };

    expect(resolveTitlesLevelView(response)).toEqual({
      kind: 'inactive-memories',
      level: 'CE1',
      currentLevel: 'CM1',
    });
  });

  it('returns inactive-empty when no title and all progress is 0', () => {
    const response: MyTitlesResponse = {
      ...baseResponse,
      level: 'CE1',
      current_level: 'CM1',
    };

    expect(resolveTitlesLevelView(response)).toEqual({
      kind: 'inactive-empty',
      level: 'CE1',
      currentLevel: 'CM1',
    });
  });
});
