import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithQueryClient } from './test-utils';
import { GameView } from './views/GameView';
import { GameClient } from './services/GameClient';
import type { Game } from './types';

describe('GameView - scoreboard connection status', () => {
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

  const game: Game = {
    id: 'G1',
    state: 'IN_PROGRESS',
    players: [
      {
        id: 'p1',
        name: 'Me',
        is_bot: false,
        is_ready: true,
        is_connected: true,
        score: 10,
        bot_config: null,
      },
      {
        id: 'p2',
        name: 'Bob',
        is_bot: false,
        is_ready: true,
        is_connected: false,
        score: 5,
        bot_config: null,
      },
    ],
    questions: [
      { id: 'q1', statement: '2 + 2', answer: 4, category: 'addition', time_limit_seconds: 10 },
    ],
    current_question_index: 0,
    answers: [],
    start_time_current_question: Date.now() / 1000,
  };

  it('marks disconnected players in the scoreboard', () => {
    renderWithQueryClient(<GameView client={client} game={game} currentPlayerId="p1" />);

    expect(screen.getByText('Bob (déconnecté)')).toBeInTheDocument();
  });
});
