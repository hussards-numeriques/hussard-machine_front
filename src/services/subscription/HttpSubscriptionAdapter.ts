import { z } from 'zod';
import type {
  AuthorizedFetch,
  SubscriptionPlan,
  SubscriptionPlanKey,
  SubscriptionRepository,
  SubscriptionStatus,
} from './port';
import { getApiUrl } from '../apiConfig';
import { ApiError } from '../http';

const subscriptionPlanSchema = z.object({
  key: z.enum(['ONE_MONTH', 'THREE_MONTHS', 'ONE_YEAR']),
  label: z.string(),
  amount: z.number(),
  currency: z.string(),
}) satisfies z.ZodType<SubscriptionPlan>;

const subscriptionPlansSchema = z.array(subscriptionPlanSchema);

const subscriptionStatusSchema = z.object({
  active: z.boolean(),
  expires_at: z.string().nullable(),
}) satisfies z.ZodType<SubscriptionStatus>;

const checkoutResponseSchema = z.object({ checkout_url: z.string().url() });

export class HttpSubscriptionAdapter implements SubscriptionRepository {
  public async fetchPlans(): Promise<SubscriptionPlan[]> {
    const response = await fetch(`${getApiUrl()}/subscription/plans`);
    if (!response.ok) {
      throw new ApiError(
        response.status,
        `Failed to fetch subscription plans (${response.status})`
      );
    }
    return subscriptionPlansSchema.parse(await response.json());
  }

  public async fetchStatus(authorizedFetch: AuthorizedFetch): Promise<SubscriptionStatus> {
    const response = await authorizedFetch(`${getApiUrl()}/subscription`);
    if (!response.ok) {
      throw new ApiError(
        response.status,
        `Failed to fetch subscription status (${response.status})`
      );
    }
    return subscriptionStatusSchema.parse(await response.json());
  }

  public async createCheckoutSession(
    authorizedFetch: AuthorizedFetch,
    plan: SubscriptionPlanKey
  ): Promise<string> {
    const response = await authorizedFetch(`${getApiUrl()}/subscription/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    if (!response.ok) {
      throw new ApiError(response.status, `Failed to create checkout session (${response.status})`);
    }
    return checkoutResponseSchema.parse(await response.json()).checkout_url;
  }
}
