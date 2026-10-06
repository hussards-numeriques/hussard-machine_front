import type { Locale } from '../../i18n/locale';

export type SubscriptionPlanKey = 'ONE_MONTH' | 'THREE_MONTHS' | 'ONE_YEAR';

export interface SubscriptionPlan {
  key: SubscriptionPlanKey;
  amount: number;
  currency: string;
}

export interface SubscriptionStatus {
  active: boolean;
  expires_at: string | null;
}

export type AuthorizedFetch = (input: string, init?: RequestInit) => Promise<Response>;

export interface SubscriptionRepository {
  fetchPlans(): Promise<SubscriptionPlan[]>;
  fetchStatus(authorizedFetch: AuthorizedFetch): Promise<SubscriptionStatus>;
  createCheckoutSession(
    authorizedFetch: AuthorizedFetch,
    plan: SubscriptionPlanKey,
    locale: Locale
  ): Promise<string>;
  redeem(authorizedFetch: AuthorizedFetch, code: string): Promise<SubscriptionStatus>;
}
