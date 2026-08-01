import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_POLL_ATTEMPTS,
  POLL_INTERVAL_MS,
  SubscriptionSuccessPage,
} from './SubscriptionSuccessPage';
import type { SubscriptionStatus } from '../services/subscription';

const mocks = vi.hoisted(() => ({
  authLoading: false,
  status: undefined as SubscriptionStatus | undefined,
  statusLoading: false,
  refetch: vi.fn(),
}));

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    client: {},
    user: null,
    isAuthenticated: true,
    isLoading: mocks.authLoading,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    reloadUser: vi.fn(),
  }),
}));

vi.mock('../hooks/useSubscription', () => ({
  useSubscriptionStatus: () => ({
    data: mocks.status,
    isLoading: mocks.statusLoading,
    refetch: mocks.refetch,
  }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <SubscriptionSuccessPage />
    </MemoryRouter>
  );

describe('SubscriptionSuccessPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authLoading = false;
    mocks.status = { active: false, expires_at: null };
    mocks.statusLoading = false;
    mocks.refetch = vi.fn(async () => ({}) as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a loading state while the status is loading', () => {
    mocks.statusLoading = true;
    renderPage();
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('shows the success message immediately when already active', () => {
    mocks.status = { active: true, expires_at: '2026-08-21T12:00:00' };
    renderPage();
    expect(screen.getByText('Paiement confirmé, ton abonnement est actif !')).toBeInTheDocument();
  });

  it('polls and shows the success message once the webhook has been processed', async () => {
    vi.useFakeTimers();
    renderPage();
    expect(screen.getByText('Confirmation en cours...')).toBeInTheDocument();

    mocks.status = { active: true, expires_at: '2026-08-21T12:00:00' };
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });

    expect(mocks.refetch).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Paiement confirmé, ton abonnement est actif !')).toBeInTheDocument();
  });

  it('gives up after the max number of poll attempts', async () => {
    vi.useFakeTimers();
    renderPage();

    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      });
    }

    expect(mocks.refetch).toHaveBeenCalledTimes(MAX_POLL_ATTEMPTS);
    expect(
      screen.getByText(
        'La confirmation prend plus de temps que prévu, réessaie de rafraîchir dans un instant.'
      )
    ).toBeInTheDocument();
  });
});
