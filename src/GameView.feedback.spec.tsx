import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithQueryClient } from './test-utils';
import { GameView } from './views/GameView';
import { GameClient } from './services/GameClient';
import type { Game } from './types';

describe('GameView - feedback', () => {
  let client: GameClient;

  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));

    class MockWebSocket {
      send = vi.fn();
      close = vi.fn();
      readyState = WebSocket.OPEN;
      onopen = null;
      onmessage = null;
      onerror = null;
      onclose = null;
    }
    (globalThis as typeof globalThis & { WebSocket: typeof WebSocket }).WebSocket =
      MockWebSocket as unknown as typeof WebSocket;

    client = new GameClient(vi.fn(), vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const game = (overrides: Partial<Game>): Game => ({
    id: 'G1',
    state: 'IN_PROGRESS',
    players: [
      {
        id: 'p1',
        name: 'Me',
        is_bot: false,
        is_ready: true,
        is_connected: true,
        score: 0,
        level: 'CP',
        grade: 'BRONZE',
        daily_streak: 0,
        bot_config: null,
        title: null,
      },
    ],
    questions: [
      {
        id: 'q1',
        statement: '7 x 8',
        answer: 56,
        category: 'multiplication',
        time_limit_seconds: 10,
      },
      { id: 'q2', statement: '3 + 3', answer: 6, category: 'addition', time_limit_seconds: 10 },
    ],
    current_question_index: 0,
    answers: [],
    start_time_current_question: Date.now() / 1000,
    ...overrides,
  });

  it('shows the on-submit pop with earned points after the player answers', () => {
    // Given
    const answered = game({
      players: [
        {
          id: 'p1',
          name: 'Me',
          is_bot: false,
          is_ready: true,
          is_connected: true,
          score: 135,
          level: 'CP',
          grade: 'BRONZE',
          daily_streak: 0,
          bot_config: null,
          title: null,
        },
      ],
      answers: [
        {
          player_id: 'p1',
          question_id: 'q1',
          value: 56,
          timestamp: 0,
          is_correct: true,
          points_earned: 135,
        },
      ],
    });

    // When
    renderWithQueryClient(<GameView client={client} game={answered} currentPlayerId="p1" />);

    // Then
    expect(screen.getByText('+135')).toBeInTheDocument();
    expect(screen.getByText('En attente des autres joueurs…')).toBeInTheDocument();
  });
});
