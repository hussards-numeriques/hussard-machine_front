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

describe('PodiumView - player levels', () => {
  const twoPlayerGame: Game = {
    ...game,
    players: [
      { ...game.players[0], level: 'CM2' },
      {
        id: 'player2',
        name: 'Player 2',
        is_bot: false,
        is_ready: true,
        is_connected: true,
        score: 100,
        level: 'SIXIEME',
        grade: 'BRONZE',
        daily_streak: 0,
        bot_config: null,
        title: null,
      },
    ],
  };

  const renderTwoPlayerPodium = (xpProgress: XpProgress | null = null) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <PodiumView
            game={twoPlayerGame}
            currentPlayerId="player1"
            playerName="Player 1"
            xpProgress={xpProgress}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('does not show a standalone level badge under the title', () => {
    renderTwoPlayerPodium();
    const title = screen.getByText('Résultats Finaux');
    expect(title.nextElementSibling).not.toHaveTextContent('CM2');
  });

  it("shows the current player's level inside the XP progress card", () => {
    mocks.config = {
      experience_per_grade: 100,
      promotion_threshold: 500,
      grades: ['BRONZE', 'SILVER', 'GOLD', 'PLATINE', 'DIAMOND'],
      levels: ['CP', 'CE1', 'CM2', 'SIXIEME'],
    };
    renderTwoPlayerPodium({
      before: { experience: 40, canPromote: false },
      after: null,
    });

    const progressTitle = screen.getByText('Progression');
    const [level] = screen.getAllByText('CM2');
    expect(
      progressTitle.compareDocumentPosition(level) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('shows every level in the full ranking', () => {
    renderTwoPlayerPodium();
    expect(screen.getAllByText('CM2')).toHaveLength(1);
    expect(screen.getByText('6ème')).toBeInTheDocument();
  });
});

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

  it('reserves the XP progress card space as soon as the before-snapshot is known, before the after-state settles', () => {
    renderPodium({
      before: { experience: 40, canPromote: false },
      after: null,
    });

    expect(screen.getByText('Progression')).toBeInTheDocument();
    expect(screen.getByText('40 XP')).toBeInTheDocument();
    expect(screen.queryByText(/^[+-]\d+ XP$/)).not.toBeInTheDocument();
  });

  it('shows the XP progress bar between the podium and the buttons', () => {
    renderPodium({
      before: { experience: 40, canPromote: false },
      after: { experience: 70, canPromote: false },
    });

    const gained = screen.getByText('+30 XP');
    const rejouer = screen.getByText('Rejouer');
    expect(gained.compareDocumentPosition(rejouer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows +0 XP for a room game with no XP gain', () => {
    renderPodium({
      before: { experience: 40, canPromote: false },
      after: { experience: 40, canPromote: false },
    });
    expect(screen.getByText('+0 XP')).toBeInTheDocument();
  });
});
