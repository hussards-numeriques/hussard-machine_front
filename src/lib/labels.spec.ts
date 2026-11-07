import { describe, expect, it } from 'vitest';
import i18n from '../i18n';
import { ApiError, apiErrorFrom } from '../services/http';
import {
  resolveApiErrorMessage,
  resolveIconLabel,
  resolvePracticeRunLabel,
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

  it.each([
    ['fr', 'Table de 6', 'Tables de 6 et 7'],
    ['en', '6 times table', '6 and 7 times tables'],
    ['es', 'Tabla del 6', 'Tablas del 6 y 7'],
    ['de', '6er-Reihe', '6 und 7er-Reihen'],
    ['it', 'Tabellina del 6', 'Tabelline del 6 e 7'],
    ['pt-BR', 'Tabuada do 6', 'Tabuadas do 6 e 7'],
  ])('labels one or several times tables in %s', (locale, one, several) => {
    const t = i18n.getFixedT(locale);
    expect(resolvePracticeTopicLabel({ kind: 'timesTables', tables: [6] }, t, locale)).toBe(one);
    expect(resolvePracticeTopicLabel({ kind: 'timesTables', tables: [6, 7] }, t, locale)).toBe(
      several
    );
  });

  it('adds the category to the notion label of a running series', () => {
    expect(
      resolvePracticeRunLabel(
        { kind: 'notion', level: 'CM1', category: 'division', promptType: 'division_table' },
        i18n.t,
        'fr'
      )
    ).toBe('Division · Tables de division');
    expect(resolvePracticeRunLabel({ kind: 'timesTables', tables: [6] }, i18n.t, 'fr')).toBe(
      'Table de 6'
    );
  });
});
