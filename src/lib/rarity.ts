export const RARITIES = ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'] as const;
export type Rarity = (typeof RARITIES)[number];

const RARITY_LABELS: Record<Rarity, string> = {
  BRONZE: 'Bronze',
  SILVER: 'Argent',
  GOLD: 'Or',
  DIAMOND: 'Diamant',
};

const RARITY_PLATES: Record<Rarity, string> = {
  BRONZE: 'title-plate-bronze',
  SILVER: 'title-plate-silver',
  GOLD: 'title-plate-gold',
  DIAMOND: 'title-plate-diamond',
};

const RARITY_ICONS: Record<Rarity, string> = {
  BRONZE: '★',
  SILVER: '★★',
  GOLD: '★★★',
  DIAMOND: '💎',
};

const RARITY_BADGE_STYLES: Record<Rarity, string> = {
  BRONZE: 'bg-amber-100 text-amber-800 border-amber-300',
  SILVER: 'bg-slate-100 text-slate-600 border-slate-300',
  GOLD: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  DIAMOND: 'bg-cyan-100 text-cyan-700 border-cyan-300',
};

export const DEFAULT_RARITY_PLATE = 'title-plate-default';
export const DEFAULT_RARITY_ICON = '☆';
export const DEFAULT_RARITY_BADGE_STYLE = 'bg-slate-100 text-slate-600 border-slate-300';

const isRarity = (value: string): value is Rarity =>
  (RARITIES as readonly string[]).includes(value);

export const resolveRarityLabel = (rarity: string): string =>
  isRarity(rarity) ? RARITY_LABELS[rarity] : rarity;

export const resolveRarityPlate = (rarity: string): string =>
  isRarity(rarity) ? RARITY_PLATES[rarity] : DEFAULT_RARITY_PLATE;

export const resolveRarityIcon = (rarity: string): string =>
  isRarity(rarity) ? RARITY_ICONS[rarity] : DEFAULT_RARITY_ICON;

export const resolveRarityBadgeStyle = (rarity: string): string =>
  isRarity(rarity) ? RARITY_BADGE_STYLES[rarity] : DEFAULT_RARITY_BADGE_STYLE;
