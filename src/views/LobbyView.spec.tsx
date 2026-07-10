import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LobbyView } from './LobbyView';
import type { Game } from '../types';
import type { GameClient } from '../services/GameClient';

describe('LobbyView - disconnected players', () => {
  const baseGame: Game = {
    id: 'ABCD',
    state: 'COUNTDOWN',
    players: [
      {
        id: 'p1',
        name: 'Alice',
        is_bot: false,
        is_ready: true,
        is_connected: true,
        score: 0,
        level: 'CP',
        grade: 'BRONZE',
        daily_streak: 0,
        bot_config: null,
      },
      {
        id: 'p2',
        name: 'Bob',
        is_bot: false,
        is_ready: true,
        is_connected: false,
        score: 0,
        level: 'CP',
        grade: 'BRONZE',
        daily_streak: 0,
        bot_config: null,
      },
    ],
    questions: [],
    current_question_index: -1,
    answers: [],
    start_time_current_question: null,
  };

  const mockClient = { setReady: vi.fn(), startGame: vi.fn() } as unknown as GameClient;

  it('shows a disconnected label for players with is_connected: false', () => {
    render(
      <LobbyView client={mockClient} game={baseGame} currentPlayerId="p1" onLeave={vi.fn()} />
    );

    expect(screen.getByText('Déconnecté')).toBeInTheDocument();
    expect(screen.queryAllByText('Humain')).toHaveLength(1);
  });
});

describe('LobbyView - leave button', () => {
  const notReadyGame: Game = {
    id: 'ABCD',
    state: 'WAITING',
    players: [
      {
        id: 'p1',
        name: 'Alice',
        is_bot: false,
        is_ready: false,
        is_connected: true,
        score: 0,
        level: 'CP',
        grade: 'BRONZE',
        daily_streak: 0,
        bot_config: null,
      },
    ],
    questions: [],
    current_question_index: -1,
    answers: [],
    start_time_current_question: null,
  };

  const mockClient = { setReady: vi.fn(), startGame: vi.fn() } as unknown as GameClient;

  it('calls onLeave when the current player is not ready and clicks Quitter', () => {
    const onLeave = vi.fn();
    render(
      <LobbyView client={mockClient} game={notReadyGame} currentPlayerId="p1" onLeave={onLeave} />
    );

    fireEvent.click(screen.getByText('Quitter'));

    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('hides Quitter once the current player is ready', () => {
    const readyGame: Game = {
      ...notReadyGame,
      players: [{ ...notReadyGame.players[0], is_ready: true }],
    };
    render(
      <LobbyView client={mockClient} game={readyGame} currentPlayerId="p1" onLeave={vi.fn()} />
    );

    expect(screen.queryByText('Quitter')).not.toBeInTheDocument();
  });
});
