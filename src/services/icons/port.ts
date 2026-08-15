export interface PlayerIcon {
  id: string;
  name: string;
  rarity: string;
  url: string;
}

export interface MyIcon extends PlayerIcon {
  unlocked_at: string;
}

export interface MyIconsResponse {
  selected_icon_id: string | null;
  icons: MyIcon[];
}

export type IconCatalog = PlayerIcon[];

export type AuthorizedFetch = (input: string, init?: RequestInit) => Promise<Response>;

export interface IconsRepository {
  fetchCatalog(): Promise<IconCatalog>;
  fetchMyIcons(authorizedFetch: AuthorizedFetch): Promise<MyIconsResponse>;
  selectIcon(authorizedFetch: AuthorizedFetch, iconId: string | null): Promise<string | null>;
}
