import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionMenuCard } from './SubscriptionStatus';
import type { SubscriptionStatus } from '../services/subscription';

const mocks = vi.hoisted(() => ({ status: undefined as SubscriptionStatus | undefined }));

vi.mock('../hooks/useSubscription', () => ({
  useSubscriptionStatus: () => ({ data: mocks.status }),
}));

const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

const renderCard = () =>
  render(
    <MemoryRouter>
      <SubscriptionMenuCard onNavigate={() => {}} />
    </MemoryRouter>
  );

describe('SubscriptionMenuCard', () => {
  beforeEach(() => {
    mocks.status = undefined;
  });

  it('renders nothing while the status is unknown', () => {
    const { container } = renderCard();
    expect(container).toBeEmptyDOMElement();
  });

  it('invites a non-subscriber to become a supporter', () => {
    mocks.status = { active: false, expires_at: null };
    renderCard();
    expect(screen.getByText('Passe à Calc Rush+').closest('a')).toHaveAttribute(
      'href',
      '/subscription'
    );
  });

  it('shows the full expiry date when the subscription has time left', () => {
    mocks.status = { active: true, expires_at: '2099-08-21T12:00:00' };
    renderCard();
    expect(screen.getByText('Calc Rush+')).toBeInTheDocument();
    expect(screen.getByText(/21 août 2099/)).toBeInTheDocument();
  });

  it('warns and offers to extend when the subscription expires within a week', () => {
    mocks.status = { active: true, expires_at: inDays(3) };
    renderCard();
    expect(screen.getByText(/Expire dans 3 jours/)).toBeInTheDocument();
    expect(screen.getByText('Prolonger')).toBeInTheDocument();
  });
});
