import { describe, expect, it } from 'vitest';
import { ApiError, apiErrorFrom } from '../services/http';
import {
  resolveApiErrorMessage,
  resolveIconLabel,
  resolveQuestionCategoryLabel,
  resolveQuestLabel,
  resolveTitleLabel,
} from './labels';

describe('labels', () => {
  it('translates known ids and falls back to the raw id', () => {
    expect(resolveQuestionCategoryLabel('half')).toBe('Moitié');
    expect(resolveQuestLabel('perfect-games')).toBe(
      'Réussir des parties parfaites (100 % de bonnes réponses)'
    );
    expect(resolveTitleLabel('correct-answers-gold')).toBe('Cerveau Quantique');
    expect(resolveIconLabel('subscriber-star')).toBe('Étoile Abonné');
    expect(resolveTitleLabel('unknown-title')).toBe('unknown-title');
  });
});

describe('API errors', () => {
  it('reads the error code from the response body', async () => {
    const error = await apiErrorFrom(
      new Response(JSON.stringify({ detail: 'SUBSCRIPTION_REQUIRED' }), { status: 403 }),
      'Failed to create lobby'
    );
    expect(error.status).toBe(403);
    expect(error.code).toBe('SUBSCRIPTION_REQUIRED');
    expect(resolveApiErrorMessage(error, 'fallback')).toBe(
      'Un abonnement actif est requis pour créer un salon.'
    );
  });

  it('keeps a null code for FastAPI generic errors', async () => {
    const error = await apiErrorFrom(
      new Response(JSON.stringify({ detail: 'Not authenticated' }), { status: 401 }),
      'Failed'
    );
    expect(error.code).toBeNull();
    expect(resolveApiErrorMessage(error, 'fallback')).toBe('fallback');
    expect(resolveApiErrorMessage(new ApiError(500, 'x'), 'fallback')).toBe('fallback');
  });
});
