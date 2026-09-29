import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RARITY_BADGE_STYLE,
  DEFAULT_RARITY_ICON,
  DEFAULT_RARITY_PLATE,
  resolveRarityBadgeStyle,
  resolveRarityIcon,
  resolveRarityLabel,
  resolveRarityPlate,
} from './rarity';

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

describe('resolveRarityPlate', () => {
  it.each([
    ['BRONZE', 'title-plate-bronze'],
    ['SILVER', 'title-plate-silver'],
    ['GOLD', 'title-plate-gold'],
    ['DIAMOND', 'title-plate-diamond'],
  ])('maps %s to %s', (rarity, expected) => {
    expect(resolveRarityPlate(rarity)).toBe(expected);
  });

  it('falls back to the default plate for an unknown rarity', () => {
    expect(resolveRarityPlate('MYTHIC')).toBe(DEFAULT_RARITY_PLATE);
  });
});

describe('resolveRarityIcon', () => {
  it.each([
    ['BRONZE', '★'],
    ['SILVER', '★★'],
    ['GOLD', '★★★'],
    ['DIAMOND', '💎'],
  ])('maps %s to %s', (rarity, expected) => {
    expect(resolveRarityIcon(rarity)).toBe(expected);
  });

  it('falls back to the default icon for an unknown rarity', () => {
    expect(resolveRarityIcon('MYTHIC')).toBe(DEFAULT_RARITY_ICON);
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
