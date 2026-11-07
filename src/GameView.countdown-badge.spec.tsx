import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, screen } from '@testing-library/react';
import { renderWithQueryClient } from './test-utils';
import { GameView } from './views/GameView';
import type { GameClient } from './services/GameClient';
import type { Game } from './types';

const play = vi.hoisted(() => vi.fn());

vi.mock('./hooks/useSound', () => ({ useSound: () => play }));

vi.mock('./contexts/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: false, isLoading: false }),
}));

const NOW_MS = 1_700_000_000_000;

const player = (score: number) => ({
  id: 'p1',
  name: 'Me',
  is_bot: false,
  is_ready: true,
  is_connected: true,
  score,
  level: 'CP' as const,
  grade: 'BRONZE' as const,
  daily_streak: 0,
  bot_config: null,
  title: null,
});

const buildGame = (answered: boolean): Game => ({
  id: 'G1',
  state: 'IN_PROGRESS',
  players: [player(answered ? 100 : 0)],
  questions: [
    {
      id: 'q1',
      prompt: { type: 'multiplication', left: 7, right: 8 },
      answer: 56,
      category: 'multiplication',
      time_limit_seconds: 10,
    },
  ],
  current_question_index: 0,
  answers: answered
    ? [
        {
          player_id: 'p1',
          question_id: 'q1',
          value: 56,
          timestamp: 0,
          is_correct: true,
          points_earned: 100,
        },
      ]
    : [],
  start_time_current_question: NOW_MS / 1000,
  host_player_id: null,
  max_players: 6,
  level: 'CP',
});

describe('GameView - countdown badge', () => {
  let countdownCallback: ((seconds: number) => void) | null;
  let client: GameClient;

  const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
  const tickCalls = () => play.mock.calls.filter(([sound]) => sound === 'tick');

  const renderGame = (answered: boolean) =>
    renderWithQueryClient(
      <GameView client={client} game={buildGame(answered)} currentPlayerId="p1" />
    );

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(NOW_MS);
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    countdownCallback = null;
    play.mockClear();
    client = {
      setQuestionCountdownCallback: (callback: ((seconds: number) => void) | null) => {
        countdownCallback = callback;
      },
      submitAnswer: vi.fn(),
    } as unknown as GameClient;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows the remaining seconds of the question', () => {
    renderGame(false);
    expect(screen.getByText('10s')).toBeInTheDocument();
    advance(2000);
    expect(screen.getByText('8s')).toBeInTheDocument();
  });

  it('hides the badge during the inter-question countdown', () => {
    renderGame(false);
    act(() => countdownCallback?.(3));
    expect(screen.queryByText(/^\d+s$/)).not.toBeInTheDocument();
  });

  it('does not tick once the player has answered', () => {
    renderGame(true);
    advance(8000);
    expect(screen.getByText('2s')).toBeInTheDocument();
    expect(tickCalls()).toHaveLength(0);
  });

  it('ticks at three seconds or less while unanswered', () => {
    renderGame(false);
    advance(6000);
    expect(tickCalls()).toHaveLength(0);
    advance(1000);
    expect(screen.getByText('3s')).toBeInTheDocument();
    expect(tickCalls().length).toBeGreaterThan(0);
  });
});
