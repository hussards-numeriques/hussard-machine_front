import { z } from 'zod';
import type { PlayerProfile } from '../types';
import { getApiUrl } from './apiConfig';
import { apiErrorFrom, type AuthorizedFetch } from './http';

const gameHistoryParticipantSchema = z.object({
  display_name: z.string(),
  is_bot: z.boolean(),
  final_rank: z.number(),
  score: z.number(),
  correct_answers: z.number(),
  total_answers: z.number(),
  experience_gained: z.number(),
});

const gameHistoryEntrySchema = z.object({
  id: z.string(),
  played_at: z.string(),
  duration_seconds: z.number(),
  is_quick_game: z.boolean(),
  questions_count: z.number(),
  winner_display_name: z.string().nullable(),
  my_rank: z.number(),
  my_score: z.number(),
  my_correct_answers: z.number(),
  my_total_answers: z.number(),
  experience_gained: z.number(),
  participants: z.array(gameHistoryParticipantSchema),
});

const playerProfileSchema = z.object({
  username: z.string(),
  level: z.string(),
  experience: z.number(),
  grade: z.string(),
  can_promote: z.boolean(),
  history: z.array(gameHistoryEntrySchema),
  selected_icon_url: z.string().nullable(),
}) satisfies z.ZodType<PlayerProfile>;

export const fetchPlayerProfile = async (
  authorizedFetch: AuthorizedFetch
): Promise<PlayerProfile> => {
  const response = await authorizedFetch(`${getApiUrl()}/me/details`);
  if (!response.ok) {
    throw await apiErrorFrom(response, 'Failed to fetch profile');
  }
  return playerProfileSchema.parse(await response.json());
};

export const promotePlayer = async (authorizedFetch: AuthorizedFetch): Promise<void> => {
  const response = await authorizedFetch(`${getApiUrl()}/me/promote`, { method: 'POST' });
  if (!response.ok) {
    throw await apiErrorFrom(response, 'Promotion failed');
  }
};

export const demotePlayer = async (authorizedFetch: AuthorizedFetch): Promise<void> => {
  const response = await authorizedFetch(`${getApiUrl()}/me/demote`, { method: 'POST' });
  if (!response.ok) {
    throw await apiErrorFrom(response, 'Demotion failed');
  }
};

export const deleteAccount = async (authorizedFetch: AuthorizedFetch): Promise<void> => {
  const response = await authorizedFetch(`${getApiUrl()}/me`, { method: 'DELETE' });
  if (!response.ok) {
    throw await apiErrorFrom(response, 'Account deletion failed');
  }
};
