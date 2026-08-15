export const RARITIES = ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'] as const;
export type Rarity = (typeof RARITIES)[number];

const RARITY_LABELS: Record<Rarity, string> = {
  BRONZE: 'Bronze',
  SILVER: 'Argent',
  GOLD: 'Or',
  DIAMOND: 'Diamant',
};

const RARITY_TEXT_COLORS: Record<Rarity, string> = {
  BRONZE: 'text-amber-600',
  SILVER: 'text-slate-500',
  GOLD: 'text-yellow-600',
  DIAMOND: 'text-cyan-600',
};

const RARITY_BADGE_STYLES: Record<Rarity, string> = {
  BRONZE: 'bg-amber-100 text-amber-800 border-amber-300',
  SILVER: 'bg-slate-100 text-slate-600 border-slate-300',
  GOLD: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  DIAMOND: 'bg-cyan-100 text-cyan-700 border-cyan-300',
};

export const DEFAULT_RARITY_TEXT_COLOR = 'text-slate-500';
export const DEFAULT_RARITY_BADGE_STYLE = 'bg-slate-100 text-slate-600 border-slate-300';

const isRarity = (value: string): value is Rarity =>
  (RARITIES as readonly string[]).includes(value);

export const resolveRarityLabel = (rarity: string): string =>
  isRarity(rarity) ? RARITY_LABELS[rarity] : rarity;

export const resolveRarityTextColor = (rarity: string): string =>
  isRarity(rarity) ? RARITY_TEXT_COLORS[rarity] : DEFAULT_RARITY_TEXT_COLOR;

export const resolveRarityBadgeStyle = (rarity: string): string =>
  isRarity(rarity) ? RARITY_BADGE_STYLES[rarity] : DEFAULT_RARITY_BADGE_STYLE;
