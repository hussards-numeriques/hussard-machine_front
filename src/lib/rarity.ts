export const RARITIES = ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'] as const;
export type Rarity = (typeof RARITIES)[number];

const RARITY_LABELS: Record<Rarity, string> = {
  BRONZE: 'Commun',
  SILVER: 'Rare',
  GOLD: 'Épique',
  DIAMOND: 'Légendaire',
};

const RARITY_TEXT_STYLES: Record<Rarity, string> = {
  BRONZE: 'text-slate-500',
  SILVER: 'text-sky-600',
  GOLD: 'text-fuchsia-600',
  DIAMOND: 'bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent',
};

const RARITY_BADGE_STYLES: Record<Rarity, string> = {
  BRONZE: 'bg-slate-100 text-slate-600 border-slate-300',
  SILVER: 'bg-sky-50 text-sky-700 border-sky-300',
  GOLD: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-300',
  DIAMOND: 'bg-orange-50 text-orange-700 border-orange-300',
};

export const DEFAULT_RARITY_TEXT_STYLE = 'text-slate-500';
export const DEFAULT_RARITY_BADGE_STYLE = 'bg-slate-100 text-slate-600 border-slate-300';

const isRarity = (value: string): value is Rarity =>
  (RARITIES as readonly string[]).includes(value);

export const resolveRarityLabel = (rarity: string): string =>
  isRarity(rarity) ? RARITY_LABELS[rarity] : rarity;

export const resolveRarityTextStyle = (rarity: string): string =>
  isRarity(rarity) ? RARITY_TEXT_STYLES[rarity] : DEFAULT_RARITY_TEXT_STYLE;

export const resolveRarityBadgeStyle = (rarity: string): string =>
  isRarity(rarity) ? RARITY_BADGE_STYLES[rarity] : DEFAULT_RARITY_BADGE_STYLE;
