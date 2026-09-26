import { z } from 'zod';
import type {
  AuthorizedFetch,
  MyTitlesResponse,
  QuestCatalog,
  QuestsRepository,
  SelectedTitle,
} from './port';
import { getApiUrl } from '../apiConfig';
import { LEVELS, type Level } from '../../lib/grades';

const levelSchema = z.enum(LEVELS);

const questTitleSchema = z.object({
  id: z.string(),
  label: z.string(),
  rarity: z.string(),
});

const questCatalogSchema = z.array(
  z.object({
    id: z.string(),
    label: z.string(),
    tiers: z.array(
      z.object({
        threshold: z.number(),
        title: questTitleSchema,
      })
    ),
  })
) satisfies z.ZodType<QuestCatalog>;

const myTitlesResponseSchema = z.object({
  level: levelSchema,
  current_level: levelSchema,
  selected_title_id: z.string().nullable(),
  titles: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      rarity: z.string(),
      unlocked_at: z.string(),
    })
  ),
  quests: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      progress: z.number(),
      tiers: z.array(
        z.object({
          threshold: z.number(),
          title_id: z.string(),
          unlocked: z.boolean(),
        })
      ),
    })
  ),
}) satisfies z.ZodType<MyTitlesResponse>;

const selectedTitleResponseSchema = z.object({
  selected_title_id: z.string().nullable(),
  level: levelSchema,
}) satisfies z.ZodType<SelectedTitle>;

export class HttpQuestsAdapter implements QuestsRepository {
  public async fetchCatalog(): Promise<QuestCatalog> {
    const response = await fetch(`${getApiUrl()}/quests`);
    if (!response.ok) {
      throw new Error(`Failed to fetch quests (${response.status})`);
    }
    return questCatalogSchema.parse(await response.json());
  }

  public async fetchMyTitles(
    authorizedFetch: AuthorizedFetch,
    level: Level | null
  ): Promise<MyTitlesResponse> {
    const url =
      level === null ? `${getApiUrl()}/me/titles` : `${getApiUrl()}/me/titles?level=${level}`;
    const response = await authorizedFetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch my titles (${response.status})`);
    }
    return myTitlesResponseSchema.parse(await response.json());
  }

  public async selectTitle(
    authorizedFetch: AuthorizedFetch,
    titleId: string | null,
    level: Level
  ): Promise<SelectedTitle> {
    const response = await authorizedFetch(`${getApiUrl()}/me/selected-title`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title_id: titleId, level }),
    });
    if (!response.ok) {
      throw new Error(`Failed to select title (${response.status})`);
    }
    return selectedTitleResponseSchema.parse(await response.json());
  }
}
