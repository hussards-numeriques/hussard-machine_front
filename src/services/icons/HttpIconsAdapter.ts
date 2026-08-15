import { z } from 'zod';
import type { AuthorizedFetch, IconCatalog, IconsRepository, MyIconsResponse } from './port';
import { getApiUrl } from '../apiConfig';

const playerIconSchema = z.object({
  id: z.string(),
  name: z.string(),
  rarity: z.string(),
  url: z.string(),
});

const iconCatalogSchema = z.array(playerIconSchema) satisfies z.ZodType<IconCatalog>;

const myIconsResponseSchema = z.object({
  selected_icon_id: z.string().nullable(),
  icons: z.array(playerIconSchema.extend({ unlocked_at: z.string() })),
}) satisfies z.ZodType<MyIconsResponse>;

const selectedIconResponseSchema = z.object({ selected_icon_id: z.string().nullable() });

export class HttpIconsAdapter implements IconsRepository {
  public async fetchCatalog(): Promise<IconCatalog> {
    const response = await fetch(`${getApiUrl()}/icons`);
    if (!response.ok) {
      throw new Error(`Failed to fetch icons (${response.status})`);
    }
    return iconCatalogSchema.parse(await response.json());
  }

  public async fetchMyIcons(authorizedFetch: AuthorizedFetch): Promise<MyIconsResponse> {
    const response = await authorizedFetch(`${getApiUrl()}/me/icons`);
    if (!response.ok) {
      throw new Error(`Failed to fetch my icons (${response.status})`);
    }
    return myIconsResponseSchema.parse(await response.json());
  }

  public async selectIcon(
    authorizedFetch: AuthorizedFetch,
    iconId: string | null
  ): Promise<string | null> {
    const response = await authorizedFetch(`${getApiUrl()}/me/selected-icon`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ icon_id: iconId }),
    });
    if (!response.ok) {
      throw new Error(`Failed to select icon (${response.status})`);
    }
    return selectedIconResponseSchema.parse(await response.json()).selected_icon_id;
  }
}
