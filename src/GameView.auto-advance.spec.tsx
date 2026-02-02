import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameView } from './views/GameView';
import { GameClient } from './services/GameClient';
import type { Game } from './types';

describe('GameView - Auto-advance when all players answered', () => {
  let mockWebSocket: {
    send: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    readyState: number;
    onopen: ((event: Event) => void) | null;
    onmessage: ((event: MessageEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    onclose: ((event: CloseEvent) => void) | null;
  };
  let gameUpdateCallback: ((game: Game) => void) | null = null;
  let errorCallback: ((error: string) => void) | null = null;
  let client: GameClient;
  let mockGame: Game;

  beforeEach(() => {
    mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      readyState: WebSocket.OPEN,
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null,
    };

    class MockWebSocket {
      send = mockWebSocket.send;
      close = mockWebSocket.close;
      readyState = WebSocket.OPEN;
      onopen = null;
      onmessage = null;
      onerror = null;
      onclose = null;
    }

    (globalThis as typeof globalThis & { WebSocket: typeof WebSocket }).WebSocket =
      MockWebSocket as unknown as typeof WebSocket;

    gameUpdateCallback = vi.fn();
    errorCallback = vi.fn();
    client = new GameClient(gameUpdateCallback, errorCallback);

    mockGame = {
      id: 'TEST1',
      state: 'IN_PROGRESS',
      players: [
        {
          id: 'player1',
          name: 'Player 1',
          is_bot: false,
          is_ready: true,
          score: 0,
          bot_config: null,
        },
        {
          id: 'player2',
          name: 'Player 2',
          is_bot: false,
          is_ready: true,
          score: 0,
          bot_config: null,
        },
      ],
      questions: [
        { id: 'q1', statement: '2 + 2', answer: 4, time_limit_seconds: 10 },
        { id: 'q2', statement: '3 + 3', answer: 6, time_limit_seconds: 10 },
      ],
      current_question_index: 0,
      answers: [],
      start_time_current_question: Date.now() / 1000,
    };

    client.connect('TEST1', 'Player 1');
    if (mockWebSocket.onopen) {
      mockWebSocket.onopen({} as Event);
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should display next question when backend auto-advances after all players answered', async () => {
    const { rerender } = render(
      <GameView client={client} game={mockGame} currentPlayerId="player1" />
    );

    expect(screen.getByText('Question 1 / 2')).toBeInTheDocument();
    expect(screen.getByText('2 + 2')).toBeInTheDocument();

    const gameWithAllPlayersAnswered: Game = {
      ...mockGame,
      current_question_index: 1,
      answers: [
        {
          player_id: 'player1',
          question_id: 'q1',
          value: 4,
          timestamp: Date.now() / 1000,
          is_correct: true,
          points_earned: 10,
        },
        {
          player_id: 'player2',
          question_id: 'q1',
          value: 4,
          timestamp: Date.now() / 1000,
          is_correct: true,
          points_earned: 10,
        },
      ],
      start_time_current_question: Date.now() / 1000,
    };

    rerender(
      <GameView client={client} game={gameWithAllPlayersAnswered} currentPlayerId="player1" />
    );

    expect(screen.getByText('Question 2 / 2')).toBeInTheDocument();
    expect(screen.getByText('3 + 3')).toBeInTheDocument();
  });

  it('should not advance if not all players have answered', () => {
    const { rerender } = render(
      <GameView client={client} game={mockGame} currentPlayerId="player1" />
    );

    expect(screen.getByText('Question 1 / 2')).toBeInTheDocument();
    expect(screen.getByText('2 + 2')).toBeInTheDocument();

    const gameWithOnlyPlayer1Answered: Game = {
      ...mockGame,
      answers: [
        {
          player_id: 'player1',
          question_id: 'q1',
          value: 4,
          timestamp: Date.now() / 1000,
          is_correct: true,
          points_earned: 10,
        },
      ],
    };

    rerender(
      <GameView client={client} game={gameWithOnlyPlayer1Answered} currentPlayerId="player1" />
    );

    expect(screen.getByText('Question 1 / 2')).toBeInTheDocument();
    expect(screen.getByText('2 + 2')).toBeInTheDocument();
    expect(screen.getByText('Réponse envoyée...')).toBeInTheDocument();
  });
});
