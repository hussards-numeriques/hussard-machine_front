import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

const mocks = vi.hoisted(() => ({ active: false }));

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    client: {},
    user: { username: 'Tim' },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    reloadUser: vi.fn(),
  }),
}));

vi.mock('../hooks/usePlayerProfile', () => ({
  usePlayerProfile: () => ({
    data: { level: 'CM1', grade: 'GOLD', selected_icon_url: null },
  }),
}));

vi.mock('../hooks/useSubscription', () => ({
  useSubscriptionStatus: () => ({
    data: { active: mocks.active, expires_at: mocks.active ? '2099-01-01T00:00:00' : null },
  }),
}));

vi.mock('./streak/StreakBadge', () => ({ StreakBadge: () => null }));

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );

describe('Header - user menu', () => {
  beforeEach(() => {
    mocks.active = false;
  });

  it('shows the player level and grade, then the menu links before the logout button', () => {
    renderHeader();

    fireEvent.click(screen.getByRole('button', { name: 'Menu du joueur' }));

    expect(screen.getByText('CM1 · Or')).toBeInTheDocument();
    const links = screen.getAllByRole('link').map((el) => el.textContent);
    const profileIndex = links.indexOf('Mon profil');
    expect(profileIndex).toBeGreaterThanOrEqual(0);
    expect(links.slice(profileIndex)).toEqual([
      'Mon profil',
      'Quêtes & Titres',
      'Icônes',
      'Réglages',
    ]);
  });

  it('crowns the avatar of a supporter only', () => {
    const { unmount } = renderHeader();
    expect(screen.queryByTestId('supporter-crown')).not.toBeInTheDocument();
    unmount();

    mocks.active = true;
    renderHeader();
    expect(screen.getByTestId('supporter-crown')).toBeInTheDocument();
  });

  it('closes the menu on an outside click', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'Menu du joueur' }));
    expect(screen.getByText('Mon profil')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Mon profil')).not.toBeInTheDocument();
  });
});
