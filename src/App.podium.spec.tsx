import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PodiumView } from './views/PodiumView';
import type { Game } from './types';
import { GameState } from './types';
import type { GameClient } from './services/GameClient';

vi.mock('./contexts/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    client: { getAccessToken: () => null },
    user: null,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe('PodiumView - Display final scores when game is finished', () => {
  let finishedGame: Game;
  let mockClient: GameClient;

  beforeEach(() => {
    vi.mock('canvas-confetti', () => ({
      default: vi.fn(),
    }));

    mockClient = {
      createQuickGame: vi.fn().mockResolvedValue('NEW_GAME_ID'),
    } as unknown as GameClient;

    finishedGame = {
      id: 'TEST1',
      state: GameState.FINISHED,
      players: [
        {
          id: 'player1',
          name: 'Player 1',
          is_bot: false,
          is_ready: true,
          score: 150,
          bot_config: null,
        },
        {
          id: 'player2',
          name: 'Player 2',
          is_bot: false,
          is_ready: true,
          score: 100,
          bot_config: null,
        },
        {
          id: 'player3',
          name: 'Player 3',
          is_bot: false,
          is_ready: true,
          score: 50,
          bot_config: null,
        },
      ],
      questions: [
        { id: 'q1', statement: '2 + 2', answer: 4, time_limit_seconds: 10 },
        { id: 'q2', statement: '3 + 3', answer: 6, time_limit_seconds: 10 },
      ],
      current_question_index: 2,
      answers: [],
      start_time_current_question: undefined,
    };
  });

  it('should display PodiumView when game state is FINISHED', () => {
    render(
      <MemoryRouter>
        <PodiumView
          game={finishedGame}
          currentPlayerId="player1"
          client={mockClient}
          playerName="Player 1"
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Résultats Finaux')).toBeInTheDocument();
    expect(screen.getAllByText('Player 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Player 2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Player 3').length).toBeGreaterThan(0);
    expect(screen.getAllByText('150 pts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('100 pts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('50 pts').length).toBeGreaterThan(0);
    expect(screen.getByText('Classement complet')).toBeInTheDocument();
    expect(screen.getByText('Rejouer')).toBeInTheDocument();
  });

  it('should display players sorted by score in descending order in ranking', () => {
    render(
      <MemoryRouter>
        <PodiumView
          game={finishedGame}
          currentPlayerId="player1"
          client={mockClient}
          playerName="Player 1"
        />
      </MemoryRouter>
    );

    const rankingSection = screen.getByText('Classement complet').closest('div');
    expect(rankingSection).toBeInTheDocument();

    const playerNames = screen.getAllByText(/Player \d/);
    const rankingPlayerNames = playerNames.filter((el) => rankingSection?.contains(el));
    expect(rankingPlayerNames[0]).toHaveTextContent('Player 1');
    expect(rankingPlayerNames[1]).toHaveTextContent('Player 2');
    expect(rankingPlayerNames[2]).toHaveTextContent('Player 3');
  });

  it('should display winner with crown emoji', () => {
    render(
      <MemoryRouter>
        <PodiumView
          game={finishedGame}
          currentPlayerId="player1"
          client={mockClient}
          playerName="Player 1"
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/👑 Player 1/)).toBeInTheDocument();
  });

  it('should display all player scores correctly', () => {
    render(
      <MemoryRouter>
        <PodiumView
          game={finishedGame}
          currentPlayerId="player1"
          client={mockClient}
          playerName="Player 1"
        />
      </MemoryRouter>
    );

    expect(screen.getAllByText('150 pts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('100 pts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('50 pts').length).toBeGreaterThan(0);
  });
});
