import { HttpSubscriptionAdapter } from './HttpSubscriptionAdapter';
import type { SubscriptionRepository } from './port';

export const subscriptionRepository: SubscriptionRepository = new HttpSubscriptionAdapter();
export type {
  AuthorizedFetch,
  SubscriptionPlan,
  SubscriptionPlanKey,
  SubscriptionRepository,
  SubscriptionStatus,
} from './port';
