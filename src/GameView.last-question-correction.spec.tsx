import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, act } from '@testing-library/react';
import { renderWithQueryClient } from './test-utils';
import { GameView } from './views/GameView';
import { GameClient } from './services/GameClient';
import type { Game } from './types';

describe('GameView - correction screen on the last question', () => {
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

  const lastQuestionGame: Game = {
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
      { id: 'q1', statement: '2 + 2', answer: 4, category: 'addition', time_limit_seconds: 10 },
      {
        id: 'q2',
        statement: '7 x 8',
        answer: 56,
        category: 'multiplication',
        time_limit_seconds: 10,
      },
    ],
    current_question_index: 1,
    answers: [
      {
        player_id: 'p1',
        question_id: 'q2',
        value: 54,
        timestamp: 0,
        is_correct: false,
        points_earned: 0,
      },
    ],
    start_time_current_question: Date.now() / 1000,
  };

  it('shows the correction for the last question when the server sends the pre-podium countdown', () => {
    // Given: the backend sends the same QUESTION_COUNTDOWN sequence after the last question
    // as it does between every other question, before flipping game.state to FINISHED.
    const setQuestionCountdownCallbackSpy = vi.spyOn(client, 'setQuestionCountdownCallback');

    renderWithQueryClient(
      <GameView client={client} game={lastQuestionGame} currentPlayerId="p1" />
    );

    const registeredCallback = setQuestionCountdownCallbackSpy.mock.calls[0][0];
    expect(registeredCallback).not.toBeNull();

    // When
    act(() => {
      registeredCallback?.(3);
    });

    // Then
    expect(screen.getByText('Mauvaise réponse')).toBeInTheDocument();
    expect(screen.getByText('54')).toBeInTheDocument();
    expect(screen.getByText('56')).toBeInTheDocument();
  });
});
