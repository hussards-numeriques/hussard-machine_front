import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RARITY_BADGE_STYLE,
  DEFAULT_RARITY_TEXT_STYLE,
  resolveRarityBadgeStyle,
  resolveRarityLabel,
  resolveRarityTextStyle,
} from './rarity';

describe('resolveRarityLabel', () => {
  it.each([
    ['BRONZE', 'Commun'],
    ['SILVER', 'Rare'],
    ['GOLD', 'Épique'],
    ['DIAMOND', 'Légendaire'],
  ])('maps %s to %s', (rarity, expected) => {
    expect(resolveRarityLabel(rarity)).toBe(expected);
  });

  it('falls back to the raw value for an unknown rarity', () => {
    expect(resolveRarityLabel('MYTHIC')).toBe('MYTHIC');
  });
});

describe('resolveRarityTextStyle', () => {
  it('maps a known rarity to a text style', () => {
    expect(resolveRarityTextStyle('GOLD')).toBe('text-fuchsia-600');
  });

  it('falls back to the default text style for an unknown rarity', () => {
    expect(resolveRarityTextStyle('MYTHIC')).toBe(DEFAULT_RARITY_TEXT_STYLE);
  });
});

describe('resolveRarityBadgeStyle', () => {
  it('maps a known rarity to a badge style', () => {
    expect(resolveRarityBadgeStyle('DIAMOND')).toBe(
      'bg-orange-50 text-orange-700 border-orange-300'
    );
  });

  it('falls back to the default badge style for an unknown rarity', () => {
    expect(resolveRarityBadgeStyle('MYTHIC')).toBe(DEFAULT_RARITY_BADGE_STYLE);
  });
});
