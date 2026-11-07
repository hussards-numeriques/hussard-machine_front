import { describe, expect, it } from 'vitest';
import i18n from '../i18n';
import { ApiError, apiErrorFrom } from '../services/http';
import {
  resolveApiErrorMessage,
  resolveIconLabel,
  resolvePracticeTopicLabel,
  resolveQuestionCategoryLabel,
  resolveQuestLabel,
  resolveTitleLabel,
} from './labels';

describe('labels', () => {
  it('translates known ids and falls back to the raw id', () => {
    expect(resolveQuestionCategoryLabel('half', i18n.t)).toBe('Moitié');
    expect(resolveQuestLabel('perfect-games', i18n.t)).toBe(
      'Réussir des parties parfaites (100 % de bonnes réponses)'
    );
    expect(resolveTitleLabel('correct-answers-gold', i18n.t)).toBe('Cerveau Quantique');
    expect(resolveIconLabel('subscriber-star', i18n.t)).toBe('Étoile Abonné');
    expect(resolveTitleLabel('unknown-title', i18n.t)).toBe('unknown-title');
  });

  it('returns an unknown quest id unchanged', () => {
    expect(resolveQuestLabel('new-quest', i18n.t)).toBe('new-quest');
  });

  it('translates a quest label', () => {
    expect(resolveQuestLabel('perfect-games', i18n.getFixedT('en'))).toBe(
      'Win perfect games (100% correct answers)'
    );
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
    expect(resolveApiErrorMessage(error, 'fallback', i18n.t)).toBe(
      'Un abonnement actif est requis pour créer une partie privée.'
    );
  });

  it('keeps a null code for FastAPI generic errors', async () => {
    const error = await apiErrorFrom(
      new Response(JSON.stringify({ detail: 'Not authenticated' }), { status: 401 }),
      'Failed'
    );
    expect(error.code).toBeNull();
    expect(resolveApiErrorMessage(error, 'fallback', i18n.t)).toBe('fallback');
    expect(resolveApiErrorMessage(new ApiError(500, 'x'), 'fallback', i18n.t)).toBe('fallback');
  });
});

describe('resolvePracticeTopicLabel', () => {
  it('lists the selected times tables', () => {
    const label = (tables: number[]) =>
      resolvePracticeTopicLabel({ kind: 'timesTables', tables }, i18n.t, 'fr');
    expect(label([6])).toBe('Table de 6');
    expect(label([6, 7])).toBe('Tables de 6 et 7');
    expect(label([6, 7, 8])).toBe('Tables de 6, 7 et 8');
  });

  it('labels a notion by its prompt type', () => {
    expect(
      resolvePracticeTopicLabel(
        { kind: 'notion', level: 'CM1', category: 'division', promptType: 'division_table' },
        i18n.t,
        'fr'
      )
    ).toBe('Tables de division');
  });
});
