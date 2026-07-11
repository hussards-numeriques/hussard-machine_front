import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RARITY_BADGE_STYLE,
  DEFAULT_RARITY_TEXT_COLOR,
  resolveRarityBadgeStyle,
  resolveRarityLabel,
  resolveRarityTextColor,
} from './titles';

describe('resolveRarityLabel', () => {
  it.each([
    ['BRONZE', 'Bronze'],
    ['SILVER', 'Argent'],
    ['GOLD', 'Or'],
    ['DIAMOND', 'Diamant'],
  ])('maps %s to %s', (rarity, expected) => {
    expect(resolveRarityLabel(rarity)).toBe(expected);
  });

  it('falls back to the raw value for an unknown rarity', () => {
    expect(resolveRarityLabel('MYTHIC')).toBe('MYTHIC');
  });
});

describe('resolveRarityTextColor', () => {
  it('maps a known rarity to a text color', () => {
    expect(resolveRarityTextColor('GOLD')).toBe('text-yellow-600');
  });

  it('falls back to the default text color for an unknown rarity', () => {
    expect(resolveRarityTextColor('MYTHIC')).toBe(DEFAULT_RARITY_TEXT_COLOR);
  });
});

describe('resolveRarityBadgeStyle', () => {
  it('maps a known rarity to a badge style', () => {
    expect(resolveRarityBadgeStyle('DIAMOND')).toBe('bg-cyan-100 text-cyan-700 border-cyan-300');
  });

  it('falls back to the default badge style for an unknown rarity', () => {
    expect(resolveRarityBadgeStyle('MYTHIC')).toBe(DEFAULT_RARITY_BADGE_STYLE);
  });
});
