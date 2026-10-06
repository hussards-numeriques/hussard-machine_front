import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from './HomePage';
import { useAuth } from '../contexts/useAuth';
import { useSubscriptionStatus } from '../hooks/useSubscription';
import { useGame } from '../contexts/useGame';
import i18n from '../i18n';

vi.mock('../contexts/useAuth');
vi.mock('../hooks/useSubscription');
vi.mock('../contexts/useGame');

describe('HomePage - create lobby button', () => {
  it('leads to the subscription page when the player has no active subscription', () => {
    vi.mocked(useAuth).mockReturnValue({
      client: { getAccessToken: () => 'tok' },
      user: { username: 'Alice' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      reloadUser: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(useSubscriptionStatus).mockReturnValue({
      data: { active: false, expires_at: null },
    } as unknown as ReturnType<typeof useSubscriptionStatus>);
    vi.mocked(useGame).mockReturnValue({
      client: { createLobby: vi.fn() },
      game: null,
      error: null,
      clearError: vi.fn(),
      resetGame: vi.fn(),
    } as unknown as ReturnType<typeof useGame>);

    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/subscription" element={<div>Subscription page</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Créer une partie privée'));

    expect(screen.getByText('Subscription page')).toBeInTheDocument();
  });

  it('is enabled and opens the creation form when the player has an active subscription', () => {
    vi.mocked(useAuth).mockReturnValue({
      client: { getAccessToken: () => 'tok' },
      user: { username: 'Alice' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      reloadUser: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(useSubscriptionStatus).mockReturnValue({
      data: { active: true, expires_at: '2026-12-01T00:00:00' },
    } as unknown as ReturnType<typeof useSubscriptionStatus>);
    vi.mocked(useGame).mockReturnValue({
      client: { createLobby: vi.fn() },
      game: null,
      error: null,
      clearError: vi.fn(),
      resetGame: vi.fn(),
    } as unknown as ReturnType<typeof useGame>);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Créer une partie privée'));

    expect(screen.getByText('Places')).toBeInTheDocument();
  });

  it('creates the lobby with the selected level and capacity then navigates', async () => {
    const createLobby = vi.fn().mockResolvedValue('GAME1');
    vi.mocked(useAuth).mockReturnValue({
      client: { getAccessToken: () => 'tok' },
      user: { username: 'Alice' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      reloadUser: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(useSubscriptionStatus).mockReturnValue({
      data: { active: true, expires_at: '2026-12-01T00:00:00' },
    } as unknown as ReturnType<typeof useSubscriptionStatus>);
    vi.mocked(useGame).mockReturnValue({
      client: { createLobby },
      game: null,
      error: null,
      clearError: vi.fn(),
      resetGame: vi.fn(),
    } as unknown as ReturnType<typeof useGame>);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Créer une partie privée'));
    fireEvent.click(screen.getByText('Créer la partie'));

    await waitFor(() => {
      expect(createLobby).toHaveBeenCalledWith({ level: 'CP', maxPlayers: 6, token: 'tok' });
    });
  });

  it('rejects an out-of-range capacity without calling createLobby', async () => {
    const createLobby = vi.fn().mockResolvedValue('GAME1');
    vi.mocked(useAuth).mockReturnValue({
      client: { getAccessToken: () => 'tok' },
      user: { username: 'Alice' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      reloadUser: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(useSubscriptionStatus).mockReturnValue({
      data: { active: true, expires_at: '2026-12-01T00:00:00' },
    } as unknown as ReturnType<typeof useSubscriptionStatus>);
    vi.mocked(useGame).mockReturnValue({
      client: { createLobby },
      game: null,
      error: null,
      clearError: vi.fn(),
      resetGame: vi.fn(),
    } as unknown as ReturnType<typeof useGame>);

    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Créer une partie privée'));
    const capacityInput = container.querySelector('input[type="number"]');
    if (!capacityInput) throw new Error('capacity input not found');
    fireEvent.change(capacityInput, { target: { value: '' } });
    fireEvent.click(screen.getByText('Créer la partie'));

    await waitFor(() => {
      expect(screen.getByText('Le nombre de places doit être entre 2 et 30.')).toBeInTheDocument();
    });
    expect(createLobby).not.toHaveBeenCalled();
  });
});

describe('HomePage - subscription status loading', () => {
  it('disables the create button with its normal label while the subscription query is pending', () => {
    vi.mocked(useAuth).mockReturnValue({
      client: { getAccessToken: () => 'tok' },
      user: { username: 'Alice' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      reloadUser: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(useSubscriptionStatus).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useSubscriptionStatus>);
    vi.mocked(useGame).mockReturnValue({
      client: { createLobby: vi.fn() },
      game: null,
      error: null,
      clearError: vi.fn(),
      resetGame: vi.fn(),
    } as unknown as ReturnType<typeof useGame>);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Créer une partie privée').closest('button')).toBeDisabled();
  });
});

describe('HomePage - i18n', () => {
  it('renders the main call to action in English', async () => {
    vi.mocked(useAuth).mockReturnValue({
      client: { getAccessToken: () => 'tok' },
      user: null,
      isAuthenticated: false,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(useSubscriptionStatus).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as unknown as ReturnType<typeof useSubscriptionStatus>);
    vi.mocked(useGame).mockReturnValue({
      client: { createLobby: vi.fn() },
    } as unknown as ReturnType<typeof useGame>);
    await i18n.changeLanguage('en');

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Ranked game')).toBeInTheDocument();
  });
});
