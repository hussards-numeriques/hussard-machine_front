import { render, screen } from '@testing-library/react';
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

describe('SubscriptionBadge', () => {
  beforeEach(() => {
    mocks.isAuthenticated = false;
    mocks.status = undefined;
  });

  it('renders nothing when not authenticated', () => {
    const { container } = render(<SubscriptionBadge />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the subscription is inactive', () => {
    mocks.isAuthenticated = true;
    mocks.status = { active: false, expires_at: null };
    const { container } = render(<SubscriptionBadge />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the expiry date when active', () => {
    mocks.isAuthenticated = true;
    mocks.status = { active: true, expires_at: '2026-08-21T12:00:00' };
    render(<SubscriptionBadge />);
    expect(screen.getByText("Actif jusqu'au 21/08")).toBeInTheDocument();
  });
});
