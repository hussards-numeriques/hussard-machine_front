import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PodiumView } from './PodiumView';
import type { Game } from '../types';
import { GameState } from '../types';
import type { XpProgress } from '../hooks/useXpProgress';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    client: { getAccessToken: () => 'token' },
    user: { username: 'Tim' },
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

const mocks = vi.hoisted(() => ({ config: undefined as unknown }));

vi.mock('../hooks/useGameConfig', () => ({
  useGameConfig: () => ({ data: mocks.config }),
}));

const game: Game = {
  id: 'G1',
  state: GameState.FINISHED,
  players: [
    {
      id: 'player1',
      name: 'Player 1',
      is_bot: false,
      is_ready: true,
      is_connected: true,
      score: 150,
      level: 'CP',
      grade: 'BRONZE',
      daily_streak: 0,
      bot_config: null,
      title: null,
    },
  ],
  questions: [],
  current_question_index: 0,
  answers: [],
  start_time_current_question: null,
  host_player_id: null,
  max_players: 6,
};

const renderPodium = (xpProgress: XpProgress | null) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PodiumView
          game={game}
          currentPlayerId="player1"
          playerName="Player 1"
          xpProgress={xpProgress}
        />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('PodiumView - XP progress', () => {
  beforeEach(() => {
    mocks.config = {
      experience_per_grade: 100,
      promotion_threshold: 500,
      grades: ['BRONZE', 'SILVER', 'GOLD', 'PLATINE', 'DIAMOND'],
      levels: ['CP', 'CE1'],
    };
  });

  it('renders nothing extra when xpProgress is null', () => {
    renderPodium(null);
    expect(screen.queryByText(/XP/)).not.toBeInTheDocument();
  });

  it('shows the XP progress bar between the podium and the buttons', () => {
    renderPodium({
      before: { experience: 40, canPromote: false },
      after: { experience: 70, canPromote: false },
      grade: 'BRONZE',
    });

    const gained = screen.getByText('+30 XP');
    const rejouer = screen.getByText('Rejouer');
    expect(gained.compareDocumentPosition(rejouer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows +0 XP for a room game with no XP gain', () => {
    renderPodium({
      before: { experience: 40, canPromote: false },
      after: { experience: 40, canPromote: false },
      grade: 'BRONZE',
    });
    expect(screen.getByText('+0 XP')).toBeInTheDocument();
  });
});
