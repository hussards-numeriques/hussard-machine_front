import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import { useAuth } from '../contexts/useAuth';
import { useSubscriptionStatus } from '../hooks/useSubscription';
import { useGame } from '../contexts/useGame';

vi.mock('../contexts/useAuth');
vi.mock('../hooks/useSubscription');
vi.mock('../contexts/useGame');

describe('HomePage - create lobby button', () => {
  it('is disabled with "Abonnement requis" when the player has no active subscription', () => {
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
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Abonnement requis')).toBeInTheDocument();
    expect(screen.getByText('Abonnement requis').closest('button')).toBeDisabled();
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

    fireEvent.click(screen.getByText('Créer un salon'));

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

    fireEvent.click(screen.getByText('Créer un salon'));
    fireEvent.click(screen.getByText('Créer'));

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

    fireEvent.click(screen.getByText('Créer un salon'));
    const capacityInput = container.querySelector('input[type="number"]');
    if (!capacityInput) throw new Error('capacity input not found');
    fireEvent.change(capacityInput, { target: { value: '' } });
    fireEvent.click(screen.getByText('Créer'));

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

    expect(screen.queryByText('Abonnement requis')).not.toBeInTheDocument();
    expect(screen.getByText('Créer un salon').closest('button')).toBeDisabled();
  });
});
