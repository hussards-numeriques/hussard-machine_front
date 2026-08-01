import { describe, expect, it, vi } from 'vitest';
import { HttpSubscriptionAdapter } from './HttpSubscriptionAdapter';
import { ApiError } from '../http';
import type { AuthorizedFetch, SubscriptionPlan } from './port';

const plansSample: SubscriptionPlan[] = [
  { key: 'ONE_MONTH', label: '1 mois', amount: 442, currency: 'eur' },
  { key: 'THREE_MONTHS', label: '3 mois', amount: 842, currency: 'eur' },
  { key: 'ONE_YEAR', label: '1 an', amount: 2718, currency: 'eur' },
];

describe('HttpSubscriptionAdapter', () => {
  it('fetches /subscription/plans without an authorizedFetch', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(plansSample), { status: 200 }));
    const adapter = new HttpSubscriptionAdapter();

    const result = await adapter.fetchPlans();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect((fetchSpy.mock.calls[0][0] as string).endsWith('/subscription/plans')).toBe(true);
    expect(result).toEqual(plansSample);
    fetchSpy.mockRestore();
  });

  it('throws an ApiError when /subscription/plans responds with an error status', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('nope', { status: 500 }));
    const adapter = new HttpSubscriptionAdapter();

    await expect(adapter.fetchPlans()).rejects.toThrow(ApiError);
    fetchSpy.mockRestore();
  });

  it('fetches /subscription via the provided authorizedFetch', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(
      async () =>
        new Response(JSON.stringify({ active: true, expires_at: '2026-08-21T12:00:00' }), {
          status: 200,
        })
    );
    const adapter = new HttpSubscriptionAdapter();

    const result = await adapter.fetchStatus(authorizedFetch);

    expect(authorizedFetch).toHaveBeenCalledTimes(1);
    expect((authorizedFetch.mock.calls[0][0] as string).endsWith('/subscription')).toBe(true);
    expect(result).toEqual({ active: true, expires_at: '2026-08-21T12:00:00' });
  });

  it('throws an ApiError when /subscription responds with an error status', async () => {
    const authorizedFetch = vi.fn(async () => new Response('nope', { status: 401 }));
    const adapter = new HttpSubscriptionAdapter();

    await expect(adapter.fetchStatus(authorizedFetch)).rejects.toThrow(ApiError);
  });

  it('POSTs the plan key and returns the checkout url', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(
      async () =>
        new Response(
          JSON.stringify({ checkout_url: 'https://checkout.stripe.com/c/pay/cs_test_1' }),
          {
            status: 200,
          }
        )
    );
    const adapter = new HttpSubscriptionAdapter();

    const result = await adapter.createCheckoutSession(authorizedFetch, 'ONE_MONTH');

    expect(authorizedFetch).toHaveBeenCalledTimes(1);
    const [url, init] = authorizedFetch.mock.calls[0];
    expect((url as string).endsWith('/subscription/checkout')).toBe(true);
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify({ plan: 'ONE_MONTH' }));
    expect(result).toBe('https://checkout.stripe.com/c/pay/cs_test_1');
  });

  it('throws an ApiError when the checkout request responds with an error status', async () => {
    const authorizedFetch = vi.fn(async () => new Response('nope', { status: 401 }));
    const adapter = new HttpSubscriptionAdapter();

    await expect(adapter.createCheckoutSession(authorizedFetch, 'ONE_MONTH')).rejects.toThrow(
      ApiError
    );
  });

  it('rejects a checkout_url that is not a valid URL', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(
      async () =>
        new Response(JSON.stringify({ checkout_url: 'not-a-url' }), {
          status: 200,
        })
    );
    const adapter = new HttpSubscriptionAdapter();

    await expect(adapter.createCheckoutSession(authorizedFetch, 'ONE_MONTH')).rejects.toThrow();
  });
});
