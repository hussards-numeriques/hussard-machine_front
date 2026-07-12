import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

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

vi.mock('./streak/StreakBadge', () => ({ StreakBadge: () => null }));

describe('Header - user menu', () => {
  it('links to /quests between the profile link and the logout button', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Tim'));

    const links = screen.getAllByRole('link').map((el) => el.textContent);
    const profileIndex = links.indexOf('Mon profil');
    expect(profileIndex).toBeGreaterThanOrEqual(0);
    expect(links[profileIndex + 1]).toBe('Quêtes & Titres');
  });
});
