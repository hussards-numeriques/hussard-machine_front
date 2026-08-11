import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/useAuth';
import { subscriptionRepository } from '../services/subscription';
import type { SubscriptionPlanKey } from '../services/subscription';

export const SUBSCRIPTION_PLANS_QUERY_KEY = ['subscription-plans'];
export const SUBSCRIPTION_STATUS_QUERY_KEY = ['subscription-status'];

export const useSubscriptionPlans = () =>
  useQuery({
    queryKey: SUBSCRIPTION_PLANS_QUERY_KEY,
    queryFn: () => subscriptionRepository.fetchPlans(),
    staleTime: Infinity,
  });

export const useSubscriptionStatus = () => {
  const { client, isAuthenticated, isLoading } = useAuth();

  return useQuery({
    queryKey: SUBSCRIPTION_STATUS_QUERY_KEY,
    queryFn: () =>
      subscriptionRepository.fetchStatus((input, init) => client.authorizedFetch(input, init)),
    enabled: isAuthenticated && !isLoading,
  });
};

export const useStartCheckout = () => {
  const { client } = useAuth();

  return useMutation({
    mutationFn: (plan: SubscriptionPlanKey) =>
      subscriptionRepository.createCheckoutSession(
        (input, init) => client.authorizedFetch(input, init),
        plan
      ),
    onSuccess: (checkoutUrl) => {
      window.location.assign(checkoutUrl);
    },
  });
};

export const useRedeem = () => {
  const { client } = useAuth();

  return useMutation({
    mutationFn: (code: string) =>
      subscriptionRepository.redeem((input, init) => client.authorizedFetch(input, init), code),
  });
};
