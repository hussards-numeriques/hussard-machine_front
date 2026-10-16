import { describe, expect, it, vi } from 'vitest';
import { fetchPracticeCatalog, fetchPracticeQuestion } from './practice';
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
  const notion = { level: 'CM1', category: 'division', promptType: 'division_table' } as const;

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
