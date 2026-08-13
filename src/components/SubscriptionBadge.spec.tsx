import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionBadge } from './SubscriptionBadge';
import type { SubscriptionStatus } from '../services/subscription';

const mocks = vi.hoisted(() => ({
  isAuthenticated: false,
  status: undefined as SubscriptionStatus | undefined,
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
  useSubscriptionStatus: () => ({ data: mocks.status }),
}));

const renderBadge = () =>
  render(
    <MemoryRouter>
      <SubscriptionBadge />
    </MemoryRouter>
  );

describe('SubscriptionBadge', () => {
  beforeEach(() => {
    mocks.isAuthenticated = false;
    mocks.status = undefined;
  });

  it('renders nothing when not authenticated', () => {
    const { container } = renderBadge();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the subscription is inactive', () => {
    mocks.isAuthenticated = true;
    mocks.status = { active: false, expires_at: null };
    const { container } = renderBadge();
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the plus icon without any visible date when active', () => {
    mocks.isAuthenticated = true;
    mocks.status = { active: true, expires_at: '2026-08-21T12:00:00' };
    renderBadge();
    expect(screen.getByRole('button', { name: 'Abonnement actif' })).toBeInTheDocument();
    expect(screen.queryByText(/août 2026/)).not.toBeInTheDocument();
  });

  it('opens a popover with the full expiry date and an extend link on click', () => {
    mocks.isAuthenticated = true;
    mocks.status = { active: true, expires_at: '2026-08-21T12:00:00' };
    renderBadge();

    fireEvent.click(screen.getByRole('button', { name: 'Abonnement actif' }));

    expect(screen.getByText("Abonnement actif jusqu'au 21 août 2026.")).toBeInTheDocument();
    expect(screen.getByText('Prolonger →').closest('a')).toHaveAttribute('href', '/subscription');
  });

  it('closes the popover on a second click', () => {
    mocks.isAuthenticated = true;
    mocks.status = { active: true, expires_at: '2026-08-21T12:00:00' };
    renderBadge();

    const button = screen.getByRole('button', { name: 'Abonnement actif' });
    fireEvent.click(button);
    expect(screen.getByText(/Abonnement actif jusqu'au/)).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByText(/Abonnement actif jusqu'au/)).not.toBeInTheDocument();
  });
});
