import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionPage } from './SubscriptionPage';
import type { SubscriptionPlan, SubscriptionStatus } from '../services/subscription';

const plans: SubscriptionPlan[] = [
  { key: 'ONE_MONTH', label: '1 mois', amount: 442, currency: 'eur' },
  { key: 'THREE_MONTHS', label: '3 mois', amount: 842, currency: 'eur' },
  { key: 'ONE_YEAR', label: '1 an', amount: 2718, currency: 'eur' },
];

const mocks = vi.hoisted(() => ({
  isAuthenticated: false,
  plans: undefined as SubscriptionPlan[] | undefined,
  plansLoading: false,
  status: undefined as SubscriptionStatus | undefined,
  statusLoading: false,
  mutate: vi.fn(),
  isPending: false,
  isError: false,
}));

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    client: {},
    user: null,
    isAuthenticated: mocks.isAuthenticated,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    reloadUser: vi.fn(),
  }),
}));

vi.mock('../hooks/useSubscription', () => ({
  useSubscriptionPlans: () => ({ data: mocks.plans, isLoading: mocks.plansLoading }),
  useSubscriptionStatus: () => ({ data: mocks.status, isLoading: mocks.statusLoading }),
  useStartCheckout: () => ({
    mutate: mocks.mutate,
    isPending: mocks.isPending,
    isError: mocks.isError,
  }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <SubscriptionPage />
    </MemoryRouter>
  );

describe('SubscriptionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAuthenticated = false;
    mocks.plans = undefined;
    mocks.plansLoading = false;
    mocks.status = undefined;
    mocks.statusLoading = false;
    mocks.isPending = false;
    mocks.isError = false;
  });

  it('prompts login when not authenticated', () => {
    renderPage();
    expect(screen.getByText('Connecte-toi pour gérer ton abonnement.')).toBeInTheDocument();
  });

  it('shows a loading state while plans are loading', () => {
    mocks.isAuthenticated = true;
    mocks.plansLoading = true;
    renderPage();
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('lists the plans with formatted prices', () => {
    mocks.isAuthenticated = true;
    mocks.plans = plans;
    mocks.status = { active: false, expires_at: null };
    renderPage();

    expect(screen.getByText('1 mois')).toBeInTheDocument();
    expect(screen.getByText('4,42 €')).toBeInTheDocument();
    expect(screen.getByText('27,18 €')).toBeInTheDocument();
    expect(screen.queryByText(/Actif jusqu'au/)).not.toBeInTheDocument();
  });

  it('shows the active banner with the formatted expiry date', () => {
    mocks.isAuthenticated = true;
    mocks.plans = plans;
    mocks.status = { active: true, expires_at: '2026-08-21T12:00:00' };
    renderPage();

    expect(screen.getByText("Actif jusqu'au 21/08.")).toBeInTheDocument();
  });

  it('starts checkout with the plan key when a buy button is clicked', () => {
    mocks.isAuthenticated = true;
    mocks.plans = plans;
    mocks.status = { active: false, expires_at: null };
    renderPage();

    fireEvent.click(screen.getAllByText('Acheter')[0]);

    expect(mocks.mutate).toHaveBeenCalledWith('ONE_MONTH');
  });

  it('shows an error message when checkout fails to start', () => {
    mocks.isAuthenticated = true;
    mocks.plans = plans;
    mocks.status = { active: false, expires_at: null };
    mocks.isError = true;
    renderPage();

    expect(screen.getByText('Impossible de lancer le paiement, réessaie.')).toBeInTheDocument();
  });
});
