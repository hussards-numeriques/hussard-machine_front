import { describe, expect, it, vi } from 'vitest';
import {
  fetchPracticeCatalog,
  fetchPracticeQuestion,
  fetchPracticeTimesTables,
  type PracticeTopic,
} from './practice';
import { ApiError, type AuthorizedFetch } from './http';

const respond = (body: unknown, status = 200) =>
  vi.fn<AuthorizedFetch>(async () => new Response(JSON.stringify(body), { status }));

describe('fetchPracticeCatalog', () => {
  it('fetches /practice/catalog and keeps only known levels and prompt types', async () => {
    const authorizedFetch = respond({
      CM1: {
        division: ['division_table', 'division', 'future_type'],
        mystery: ['future_type'],
      },
      UNKNOWN: { addition: ['addition'] },
    });

    const catalog = await fetchPracticeCatalog(authorizedFetch);

    expect((authorizedFetch.mock.calls[0][0] as string).endsWith('/practice/catalog')).toBe(true);
    expect(catalog).toEqual({ CM1: { division: ['division_table', 'division'] } });
  });

  it('throws an ApiError carrying the subscription code', async () => {
    const error = await fetchPracticeCatalog(
      respond({ detail: 'SUBSCRIPTION_REQUIRED' }, 403)
    ).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('SUBSCRIPTION_REQUIRED');
  });
});

describe('fetchPracticeQuestion', () => {
  const notion = {
    kind: 'notion',
    level: 'CM1',
    category: 'division',
    promptType: 'division_table',
  } as const;

  it('fetches one question for the notion', async () => {
    const authorizedFetch = respond({
      prompt: { type: 'division_table', dividend: 56, divisor: 7 },
      answer: 8,
    });

    const question = await fetchPracticeQuestion(authorizedFetch, notion);

    expect(
      (authorizedFetch.mock.calls[0][0] as string).endsWith('/practice/CM1/division/division_table')
    ).toBe(true);
    expect(question).toEqual({
      prompt: { type: 'division_table', dividend: 56, divisor: 7 },
      answer: 8,
    });
  });

  it('maps unlocked_icon to unlockedIcon', async () => {
    const icon = { id: 'practice-silver', rarity: 'SILVER', url: 'http://x/practice-silver.svg' };
    const question = await fetchPracticeQuestion(
      respond({ prompt: { type: 'double', value: 4 }, answer: 8, unlocked_icon: icon }),
      notion
    );

    expect(question.unlockedIcon).toEqual(icon);
  });

  it('treats a null or missing unlocked_icon as absent', async () => {
    const withNull = await fetchPracticeQuestion(
      respond({ prompt: { type: 'double', value: 4 }, answer: 8, unlocked_icon: null }),
      notion
    );
    const without = await fetchPracticeQuestion(
      respond({ prompt: { type: 'double', value: 4 }, answer: 8 }),
      notion
    );

    expect(withNull.unlockedIcon).toBeUndefined();
    expect(without.unlockedIcon).toBeUndefined();
  });

  it('rejects a malformed prompt', async () => {
    await expect(
      fetchPracticeQuestion(respond({ prompt: { type: 'division_table' }, answer: 8 }), notion)
    ).rejects.toThrow();
  });

  it('exposes PRACTICE_NOT_AVAILABLE', async () => {
    const error = await fetchPracticeQuestion(
      respond({ detail: 'PRACTICE_NOT_AVAILABLE' }, 404),
      notion
    ).catch((e: unknown) => e);

    expect((error as ApiError).code).toBe('PRACTICE_NOT_AVAILABLE');
  });
});

describe('fetchPracticeTimesTables', () => {
  it('fetches /practice/times-tables', async () => {
    const authorizedFetch = respond({ tables: [1, 2] });

    const tables = await fetchPracticeTimesTables(authorizedFetch);

    expect((authorizedFetch.mock.calls[0][0] as string).endsWith('/practice/times-tables')).toBe(
      true
    );
    expect(tables).toEqual([1, 2]);
  });

  it('throws an ApiError carrying the subscription code', async () => {
    const error = await fetchPracticeTimesTables(
      respond({ detail: 'SUBSCRIPTION_REQUIRED' }, 403)
    ).catch((e: unknown) => e);

    expect((error as ApiError).code).toBe('SUBSCRIPTION_REQUIRED');
  });
});

describe('fetchPracticeQuestion for times tables', () => {
  const topic: PracticeTopic = { kind: 'timesTables', tables: [6, 7] };

  it('sends one tables parameter per table', async () => {
    const authorizedFetch = respond({
      prompt: { type: 'multiplication_table', table: 6, factor: 3 },
      answer: 18,
    });

    const question = await fetchPracticeQuestion(authorizedFetch, topic);

    expect(
      (authorizedFetch.mock.calls[0][0] as string).endsWith(
        '/practice/times-tables/question?tables=6&tables=7'
      )
    ).toBe(true);
    expect(question).toEqual({
      prompt: { type: 'multiplication_table', table: 6, factor: 3 },
      answer: 18,
    });
  });

  it('throws an ApiError carrying the subscription code', async () => {
    const error = await fetchPracticeQuestion(
      respond({ detail: 'SUBSCRIPTION_REQUIRED' }, 403),
      topic
    ).catch((e: unknown) => e);

    expect((error as ApiError).code).toBe('SUBSCRIPTION_REQUIRED');
  });
});
