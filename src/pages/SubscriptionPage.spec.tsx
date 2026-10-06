import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionPage } from './SubscriptionPage';
import type { SubscriptionPlan, SubscriptionStatus } from '../services/subscription';
import { PARENTAL_GATE_QUESTIONS, type ParentalGateQuestion } from '../lib/parentalGate';

const plans: SubscriptionPlan[] = [
  { key: 'ONE_MONTH', amount: 442, currency: 'eur' },
  { key: 'THREE_MONTHS', amount: 842, currency: 'eur' },
  { key: 'ONE_YEAR', amount: 2718, currency: 'eur' },
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

const displayedGateQuestion = (): ParentalGateQuestion => {
  const question = PARENTAL_GATE_QUESTIONS.find((q) => screen.queryByText(q.prompt));
  if (!question) {
    throw new Error('No parental gate question displayed');
  }
  return question;
};

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

  it('shows a notice instead of crashing when the plan catalog is empty', () => {
    mocks.isAuthenticated = true;
    mocks.plans = [];
    renderPage();

    expect(
      screen.getByText('Impossible de charger les formules pour le moment.')
    ).toBeInTheDocument();
  });

  it('renders the pricing card once plans and status are loaded', () => {
    mocks.isAuthenticated = true;
    mocks.plans = plans;
    mocks.status = { active: false, expires_at: null };
    renderPage();

    expect(screen.getByText('Calc Rush+')).toBeInTheDocument();
    expect(screen.getByText('Parties privées')).toBeInTheDocument();
    expect(screen.getByText('8,42 €')).toBeInTheDocument();
    expect(screen.queryByText(/Actif jusqu'au/)).not.toBeInTheDocument();
  });

  it('asks an adult to pass the parental gate before starting checkout', () => {
    mocks.isAuthenticated = true;
    mocks.plans = plans;
    mocks.status = { active: false, expires_at: null };
    renderPage();

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('Passer à Calc Rush+ · 3 mois'));

    expect(mocks.mutate).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: String(displayedGateQuestion().answer) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));

    expect(mocks.mutate).toHaveBeenCalledWith('THREE_MONTHS');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the parental gate without paying when cancelled', () => {
    mocks.isAuthenticated = true;
    mocks.plans = plans;
    mocks.status = { active: false, expires_at: null };
    renderPage();

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('Passer à Calc Rush+ · 3 mois'));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  it('shows an error message when checkout fails to start', () => {
    mocks.isAuthenticated = true;
    mocks.plans = plans;
    mocks.status = { active: false, expires_at: null };
    mocks.isError = true;
    renderPage();

    expect(screen.getByText('Impossible de lancer le paiement, réessaie.')).toBeInTheDocument();
  });

  it('links to the terms of sale', () => {
    mocks.isAuthenticated = true;
    mocks.plans = plans;
    mocks.status = { active: false, expires_at: null };
    renderPage();

    expect(screen.getByText('Conditions de vente').closest('a')).toHaveAttribute(
      'href',
      '/terms-of-sale'
    );
  });
});
