import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PodiumView } from './views/PodiumView';
import type { Game } from './types';
import { GameState } from './types';

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

vi.mock('./hooks/useGameConfig', () => ({
  useGameConfig: () => ({ data: undefined }),
}));

describe('PodiumView - Display final scores when game is finished', () => {
  let finishedGame: Game;

  beforeEach(() => {
    vi.mock('canvas-confetti', () => ({
      default: vi.fn(),
    }));

    finishedGame = {
      id: 'TEST1',
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
        {
          id: 'player2',
          name: 'Player 2',
          is_bot: false,
          is_ready: true,
          is_connected: true,
          score: 100,
          level: 'CP',
          grade: 'BRONZE',
          daily_streak: 0,
          bot_config: null,
          title: null,
        },
        {
          id: 'player3',
          name: 'Player 3',
          is_bot: false,
          is_ready: true,
          is_connected: true,
          score: 50,
          level: 'CP',
          grade: 'BRONZE',
          daily_streak: 0,
          bot_config: null,
          title: null,
        },
      ],
      questions: [
        { id: 'q1', statement: '2 + 2', answer: 4, category: 'addition', time_limit_seconds: 10 },
        { id: 'q2', statement: '3 + 3', answer: 6, category: 'addition', time_limit_seconds: 10 },
      ],
      current_question_index: 2,
      answers: [],
      start_time_current_question: null,
      host_player_id: null,
      max_players: 6,
    };
  });

  it('should display PodiumView when game state is FINISHED', () => {
    render(
      <MemoryRouter>
        <PodiumView game={finishedGame} currentPlayerId="player1" playerName="Player 1" />
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
        <PodiumView game={finishedGame} currentPlayerId="player1" playerName="Player 1" />
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
        <PodiumView game={finishedGame} currentPlayerId="player1" playerName="Player 1" />
      </MemoryRouter>
    );

    expect(screen.getByText(/👑 Player 1/)).toBeInTheDocument();
  });

  it('should display all player scores correctly', () => {
    render(
      <MemoryRouter>
        <PodiumView game={finishedGame} currentPlayerId="player1" playerName="Player 1" />
      </MemoryRouter>
    );

    expect(screen.getAllByText('150 pts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('100 pts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('50 pts').length).toBeGreaterThan(0);
  });

  it('should render the action buttons before the full ranking list', () => {
    render(
      <MemoryRouter>
        <PodiumView game={finishedGame} currentPlayerId="player1" playerName="Player 1" />
      </MemoryRouter>
    );

    const rejouer = screen.getByText('Rejouer');
    const classement = screen.getByText('Classement complet');
    const position = rejouer.compareDocumentPosition(classement);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('should show answer result dots under each player score in the ranking', () => {
    finishedGame.answers = [
      {
        player_id: 'player1',
        question_id: 'q1',
        value: 4,
        timestamp: 1,
        is_correct: true,
        points_earned: 10,
      },
      {
        player_id: 'player1',
        question_id: 'q2',
        value: 6,
        timestamp: 2,
        is_correct: true,
        points_earned: 10,
      },
      {
        player_id: 'player2',
        question_id: 'q1',
        value: 4,
        timestamp: 1,
        is_correct: true,
        points_earned: 10,
      },
      {
        player_id: 'player2',
        question_id: 'q2',
        value: 1,
        timestamp: 2,
        is_correct: false,
        points_earned: 0,
      },
    ];

    render(
      <MemoryRouter>
        <PodiumView game={finishedGame} currentPlayerId="player1" playerName="Player 1" />
      </MemoryRouter>
    );

    const dotGroups = screen.getAllByTestId('answer-dots');
    expect(dotGroups).toHaveLength(3);

    const player1Dots = dotGroups[0].querySelectorAll('[data-testid="dot"]');
    expect(player1Dots).toHaveLength(2);
    expect(player1Dots[0]).toHaveClass('bg-emerald-500');
    expect(player1Dots[1]).toHaveClass('bg-emerald-500');

    const player2Dots = dotGroups[1].querySelectorAll('[data-testid="dot"]');
    expect(player2Dots[0]).toHaveClass('bg-emerald-500');
    expect(player2Dots[1]).toHaveClass('bg-red-400');

    const player3Dots = dotGroups[2].querySelectorAll('[data-testid="dot"]');
    expect(player3Dots[0]).toHaveClass('bg-slate-300');
    expect(player3Dots[1]).toHaveClass('bg-slate-300');
  });
});

describe('PodiumView - player title', () => {
  it('shows the equipped title under the name in the full ranking but not in the top-3 columns', () => {
    const gameWithTitle: Game = {
      id: 'TEST2',
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
          title: { id: 'win-streak-gold', label: "Légende de l'Arène", rarity: 'GOLD' },
        },
      ],
      questions: [],
      current_question_index: 0,
      answers: [],
      start_time_current_question: null,
      host_player_id: null,
      max_players: 6,
    };

    render(
      <MemoryRouter>
        <PodiumView game={gameWithTitle} currentPlayerId="player1" playerName="Player 1" />
      </MemoryRouter>
    );

    const rankingSection = screen.getByText('Classement complet').closest('div');
    const titleEls = screen.getAllByText(/Légende de l'Arène/);
    expect(titleEls).toHaveLength(1);
    expect(rankingSection?.contains(titleEls[0])).toBe(true);
  });
});
