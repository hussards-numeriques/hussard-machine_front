import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfilePage } from './ProfilePage';
import type { GameConfig, PlayerProfile } from '../types';
import type { SubscriptionStatus } from '../services/subscription';

const profile: PlayerProfile = {
  username: 'Tim',
  level: 'CM1',
  experience: 120,
  grade: 'BRONZE',
  can_promote: false,
  history: [],
  selected_icon_url: null,
};

const config: GameConfig = {
  experience_per_grade: 500,
  promotion_threshold: 500,
  grades: ['BRONZE', 'SILVER', 'GOLD', 'PLATINE', 'DIAMOND'],
  levels: ['CP', 'CE1', 'CE2', 'CM1', 'CM2', 'SIXIEME', 'CINQUIEME', 'QUATRIEME', 'TROISIEME'],
};

const mocks = vi.hoisted(() => ({
  isAuthenticated: true,
  authLoading: false,
  profile: undefined as PlayerProfile | undefined,
  profileLoading: false,
  profileError: false,
  status: undefined as SubscriptionStatus | undefined,
}));

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    client: {},
    user: mocks.isAuthenticated ? { username: 'Tim' } : null,
    isAuthenticated: mocks.isAuthenticated,
    isLoading: mocks.authLoading,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    reloadUser: vi.fn(),
  }),
}));

vi.mock('../hooks/useGameConfig', () => ({
  useGameConfig: () => ({ data: config }),
}));

vi.mock('../hooks/usePlayerProfile', () => ({
  usePlayerProfile: () => ({
    data: mocks.profile,
    isLoading: mocks.profileLoading,
    isError: mocks.profileError,
    error: null,
  }),
  usePromotePlayer: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
  useDemotePlayer: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
}));

vi.mock('../hooks/useSubscription', () => ({
  useSubscriptionStatus: () => ({ data: mocks.status }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  );

describe('ProfilePage subscription info', () => {
  beforeEach(() => {
    mocks.isAuthenticated = true;
    mocks.authLoading = false;
    mocks.profile = profile;
    mocks.profileLoading = false;
    mocks.profileError = false;
    mocks.status = undefined;
  });

  it('shows nothing about the subscription when inactive', () => {
    mocks.status = { active: false, expires_at: null };
    renderPage();
    expect(screen.queryByText(/Abonnement actif/)).not.toBeInTheDocument();
  });

  it('shows the full expiry date when the subscription is active', () => {
    mocks.status = { active: true, expires_at: '2026-08-21T12:00:00' };
    renderPage();
    expect(screen.getByText("Abonnement actif jusqu'au 21 août 2026.")).toBeInTheDocument();
  });

  it('shows nothing about the subscription when active but expires_at is null', () => {
    mocks.status = { active: true, expires_at: null };
    renderPage();
    expect(screen.queryByText(/Abonnement actif/)).not.toBeInTheDocument();
  });
});

describe('ProfilePage history answer dots', () => {
  beforeEach(() => {
    mocks.isAuthenticated = true;
    mocks.authLoading = false;
    mocks.profile = {
      ...profile,
      history: [
        {
          id: 'game-1',
          played_at: '2026-08-10T10:00:00Z',
          duration_seconds: 60,
          is_quick_game: false,
          questions_count: 5,
          winner_display_name: 'Tim',
          my_rank: 1,
          my_score: 100,
          my_correct_answers: 3,
          my_total_answers: 4,
          experience_gained: 20,
          participants: [
            {
              display_name: 'Tim',
              is_bot: false,
              final_rank: 1,
              score: 100,
              correct_answers: 3,
              total_answers: 4,
              experience_gained: 20,
            },
          ],
        },
      ],
    };
    mocks.profileLoading = false;
    mocks.profileError = false;
    mocks.status = undefined;
  });

  it('shows answer dots instead of X/Y text in the expanded participants table', () => {
    const { getByText, getAllByTestId, queryByText } = renderPage();
    fireEvent.click(getByText(/bonnes réponses/));

    expect(queryByText('3/4')).not.toBeInTheDocument();
    expect(getAllByTestId('dot')).toHaveLength(5);
  });

  it('splits the dots into 3 correct, 1 incorrect, 1 timeout for a 3/4-out-of-5 participant', () => {
    const { getByText, getByTestId } = renderPage();
    fireEvent.click(getByText(/bonnes réponses/));

    const dots = getByTestId('answer-dots').querySelectorAll('[data-testid="dot"]');
    expect(dots).toHaveLength(5);
    expect(dots[0]).toHaveClass('bg-emerald-500');
    expect(dots[1]).toHaveClass('bg-emerald-500');
    expect(dots[2]).toHaveClass('bg-emerald-500');
    expect(dots[3]).toHaveClass('bg-red-400');
    expect(dots[4]).toHaveClass('bg-slate-300');
  });
});
