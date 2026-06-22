import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../../contexts/AuthContext';
import { StreakContext, type StreakContextValue } from '../../contexts/StreakContext';
import type { StreakResponse } from '../../services/streak';
import { StreakBadge } from './StreakBadge';

const authValue = (isAuthenticated: boolean): AuthContextValue => ({
  client: {} as AuthContextValue['client'],
  user: isAuthenticated ? ({ username: 'Tim' } as AuthContextValue['user']) : null,
  isAuthenticated,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

const renderBadge = (isAuthenticated: boolean, streak: StreakResponse | null) => {
  const streakValue: StreakContextValue = { streak, isLoading: false, refresh: async () => {} };
  return render(
    <AuthContext.Provider value={authValue(isAuthenticated)}>
      <StreakContext.Provider value={streakValue}>
        <StreakBadge />
      </StreakContext.Provider>
    </AuthContext.Provider>
  );
};

describe('StreakBadge', () => {
  it('renders nothing when not authenticated', () => {
    const { container } = renderBadge(false, {
      current_count: 5,
      played_today: true,
      freeze_available_on: null,
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when streak data is missing', () => {
    const { container } = renderBadge(true, null);
    expect(container.firstChild).toBeNull();
  });

  it('shows the count and a secured quest icon when played today', () => {
    const { container } = renderBadge(true, {
      current_count: 12,
      played_today: true,
      freeze_available_on: null,
    });
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(container.querySelector('[data-quest="secured"]')).not.toBeNull();
  });

  it('hides the count and mutes the flame at count 0', () => {
    const { container } = renderBadge(true, {
      current_count: 0,
      played_today: false,
      freeze_available_on: null,
    });
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(container.querySelector('[data-quest="neutral"]')).not.toBeNull();
  });

  it('opens a soft-risk popover on click without a day counter', () => {
    const { container } = renderBadge(true, {
      current_count: 8,
      played_today: false,
      freeze_available_on: null,
    });
    expect(container.querySelector('[data-quest="soft-risk"]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /quête/i }));
    expect(screen.getByText(/sécuriser ta série/i)).toBeInTheDocument();
  });

  it('opens a last-chance popover with the days until the safety net returns', () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    const pad = (n: number) => String(n).padStart(2, '0');
    const iso = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}`;
    renderBadge(true, { current_count: 8, played_today: false, freeze_available_on: iso });
    fireEvent.click(screen.getByRole('button', { name: /quête/i }));
    expect(screen.getByText(/dans 3 jours/i)).toBeInTheDocument();
  });

  it('opens a secured popover with a live countdown to UTC midnight', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-22T23:59:58.000Z'));
    renderBadge(true, { current_count: 12, played_today: true, freeze_available_on: null });
    fireEvent.click(screen.getByRole('button', { name: /quête/i }));
    expect(screen.getByText(/00:00:02/)).toBeInTheDocument();
    vi.useRealTimers();
  });
});
