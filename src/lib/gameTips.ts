const TIP_IDS = {
  guest: ['progress', 'customize', 'streak'],
  member: ['levelUp', 'inputMode', 'schoolLevel', 'titles', 'practice', 'privateGames'],
  subscriber: ['practice', 'privateGames', 'quests', 'icon', 'inputMode'],
} as const;

export type TipAudience = keyof typeof TIP_IDS;

export type GameTipKey = {
  [A in TipAudience]: `gameTips.${A}.${(typeof TIP_IDS)[A][number]}`;
}[TipAudience];

export const resolveTipAudience = (
  isAuthenticated: boolean,
  isSubscriber: boolean
): TipAudience => {
  if (!isAuthenticated) return 'guest';
  return isSubscriber ? 'subscriber' : 'member';
};

export const pickGameTipKey = (audience: TipAudience, random: number): GameTipKey => {
  const ids: readonly string[] = TIP_IDS[audience];
  const index = Math.min(Math.floor(random * ids.length), ids.length - 1);
  return `gameTips.${audience}.${ids[index]}` as GameTipKey;
};
