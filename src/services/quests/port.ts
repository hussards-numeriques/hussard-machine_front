export interface QuestTitle {
  id: string;
  label: string;
  rarity: string;
}

export interface QuestTier {
  threshold: number;
  title: QuestTitle;
}

export interface Quest {
  id: string;
  label: string;
  tiers: QuestTier[];
}

export type QuestCatalog = Quest[];

export interface MyTitle {
  id: string;
  label: string;
  rarity: string;
  unlocked_at: string;
}

export interface MyQuestTier {
  threshold: number;
  title_id: string;
  unlocked: boolean;
}

export interface MyQuest {
  id: string;
  label: string;
  progress: number;
  tiers: MyQuestTier[];
}

export interface MyTitlesResponse {
  selected_title_id: string | null;
  titles: MyTitle[];
  quests: MyQuest[];
}

export type AuthorizedFetch = (input: string, init?: RequestInit) => Promise<Response>;

export interface QuestsRepository {
  fetchCatalog(): Promise<QuestCatalog>;
  fetchMyTitles(authorizedFetch: AuthorizedFetch): Promise<MyTitlesResponse>;
  selectTitle(authorizedFetch: AuthorizedFetch, titleId: string | null): Promise<string | null>;
}
