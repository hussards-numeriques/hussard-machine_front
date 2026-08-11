import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SUBSCRIPTION_STATUS_QUERY_KEY,
  useRedeem,
  useStartCheckout,
  useSubscriptionPlans,
  useSubscriptionStatus,
} from './useSubscription';
import { ApiError } from '../services/http';

const mocks = vi.hoisted(() => ({
  isAuthenticated: false,
  fetchPlans: vi.fn(),
  fetchStatus: vi.fn(),
  createCheckoutSession: vi.fn(),
  redeem: vi.fn(),
}));

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    client: { authorizedFetch: vi.fn() },
    user: null,
    isAuthenticated: mocks.isAuthenticated,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    reloadUser: vi.fn(),
  }),
}));

vi.mock('../services/subscription', () => ({
  subscriptionRepository: {
    fetchPlans: mocks.fetchPlans,
    fetchStatus: mocks.fetchStatus,
    createCheckoutSession: mocks.createCheckoutSession,
    redeem: mocks.redeem,
  },
}));

let latestQueryClient: QueryClient;

const wrapper = ({ children }: { children: ReactNode }) => {
  latestQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={latestQueryClient}>{children}</QueryClientProvider>;
};

describe('useSubscriptionPlans', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches the plans without requiring authentication', async () => {
    mocks.fetchPlans.mockResolvedValue([]);

    const { result } = renderHook(() => useSubscriptionPlans(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.fetchPlans).toHaveBeenCalledTimes(1);
  });
});

describe('useSubscriptionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAuthenticated = false;
  });

  it('does not fetch when the player is not authenticated', () => {
    const { result } = renderHook(() => useSubscriptionStatus(), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mocks.fetchStatus).not.toHaveBeenCalled();
  });

  it('fetches the status when authenticated', async () => {
    mocks.isAuthenticated = true;
    mocks.fetchStatus.mockResolvedValue({ active: false, expires_at: null });

    const { result } = renderHook(() => useSubscriptionStatus(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.fetchStatus).toHaveBeenCalledTimes(1);
  });
});

describe('useStartCheckout', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAuthenticated = true;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign: vi.fn() },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  it('calls the repository with the plan key and redirects to the returned url', async () => {
    mocks.createCheckoutSession.mockResolvedValue('https://checkout.stripe.com/c/pay/cs_test_1');

    const { result } = renderHook(() => useStartCheckout(), { wrapper });

    act(() => {
      result.current.mutate('ONE_MONTH');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.createCheckoutSession).toHaveBeenCalledWith(expect.any(Function), 'ONE_MONTH');
    expect(window.location.assign).toHaveBeenCalledWith(
      'https://checkout.stripe.com/c/pay/cs_test_1'
    );
  });
});

describe('useRedeem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAuthenticated = true;
  });

  it('calls the repository with the code and returns the updated status', async () => {
    mocks.redeem.mockResolvedValue({ active: true, expires_at: '2027-08-11T12:00:00' });

    const { result } = renderHook(() => useRedeem(), { wrapper });

    act(() => {
      result.current.mutate('my-secret-code');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.redeem).toHaveBeenCalledWith(expect.any(Function), 'my-secret-code');
    expect(result.current.data).toEqual({ active: true, expires_at: '2027-08-11T12:00:00' });
  });

  it('surfaces the error when the code is rejected', async () => {
    mocks.redeem.mockRejectedValue(new ApiError(400, 'Failed to redeem code (400)'));

    const { result } = renderHook(() => useRedeem(), { wrapper });

    act(() => {
      result.current.mutate('bad-code');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('updates the subscription-status query cache on success', async () => {
    mocks.redeem.mockResolvedValue({ active: true, expires_at: '2027-08-11T12:00:00' });

    const { result } = renderHook(() => useRedeem(), { wrapper });

    act(() => {
      result.current.mutate('my-secret-code');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(latestQueryClient.getQueryData(SUBSCRIPTION_STATUS_QUERY_KEY)).toEqual({
      active: true,
      expires_at: '2027-08-11T12:00:00',
    });
  });
});
