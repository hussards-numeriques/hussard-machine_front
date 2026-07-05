import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
        bot_config: null,
      },
      {
        id: 'p2',
        name: 'Bob',
        is_bot: false,
        is_ready: true,
        is_connected: false,
        score: 0,
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
    render(<LobbyView client={mockClient} game={baseGame} currentPlayerId="p1" />);

    expect(screen.getByText('Déconnecté')).toBeInTheDocument();
    expect(screen.queryAllByText('Humain')).toHaveLength(1);
  });
});
