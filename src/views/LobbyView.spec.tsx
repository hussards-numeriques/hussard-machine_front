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
        title: null,
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
        title: null,
      },
    ],
    questions: [],
    current_question_index: -1,
    answers: [],
    start_time_current_question: null,
    host_player_id: null,
    max_players: 6,
  };

  const mockClient = { setReady: vi.fn(), startGame: vi.fn() } as unknown as GameClient;

  it('shows a disconnected label for players with is_connected: false', () => {
    render(
      <LobbyView client={mockClient} game={baseGame} currentPlayerId="p1" onLeave={vi.fn()} />
    );

    expect(screen.getByText('Déconnecté')).toBeInTheDocument();
    expect(screen.queryByText('Humain')).not.toBeInTheDocument();
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
        title: null,
      },
    ],
    questions: [],
    current_question_index: -1,
    answers: [],
    start_time_current_question: null,
    host_player_id: null,
    max_players: 6,
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

describe('LobbyView - player title', () => {
  const gameWithTitle: Game = {
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
        title: { id: 'win-streak-gold', label: "Légende de l'Arène", rarity: 'GOLD' },
      },
    ],
    questions: [],
    current_question_index: -1,
    answers: [],
    start_time_current_question: null,
    host_player_id: null,
    max_players: 6,
  };

  const mockClient = { setReady: vi.fn(), startGame: vi.fn() } as unknown as GameClient;

  it('shows the equipped title under the player name', () => {
    render(
      <LobbyView client={mockClient} game={gameWithTitle} currentPlayerId="p1" onLeave={vi.fn()} />
    );

    expect(screen.getByText(/Légende de l'Arène/)).toBeInTheDocument();
  });

  it('shows nothing extra when the player has no title', () => {
    const gameWithoutTitle: Game = {
      ...gameWithTitle,
      players: [{ ...gameWithTitle.players[0], title: null }],
    };
    render(
      <LobbyView
        client={mockClient}
        game={gameWithoutTitle}
        currentPlayerId="p1"
        onLeave={vi.fn()}
      />
    );

    expect(screen.queryByText(/☆/)).not.toBeInTheDocument();
  });
});

describe('LobbyView - host controls', () => {
  const privateGame: Game = {
    id: 'ABCD',
    state: 'WAITING',
    is_quick_game: false,
    host_player_id: 'p1',
    max_players: 3,
    players: [
      {
        id: 'p1',
        name: 'Host',
        is_bot: false,
        is_ready: false,
        is_connected: true,
        score: 0,
        level: 'CP',
        grade: 'BRONZE',
        daily_streak: 0,
        bot_config: null,
        title: null,
      },
      {
        id: 'p2',
        name: 'Guest',
        is_bot: false,
        is_ready: false,
        is_connected: true,
        score: 0,
        level: 'CP',
        grade: 'BRONZE',
        daily_streak: 0,
        bot_config: null,
        title: null,
      },
    ],
    questions: [],
    current_question_index: -1,
    answers: [],
    start_time_current_question: null,
  };

  it('shows add-bot buttons and a capacity counter to the host', () => {
    const mockClient = { setReady: vi.fn(), startGame: vi.fn() } as unknown as GameClient;
    render(
      <LobbyView client={mockClient} game={privateGame} currentPlayerId="p1" onLeave={vi.fn()} />
    );

    expect(screen.getByText('Places : 2/3')).toBeInTheDocument();
    expect(screen.getByText('Facile')).toBeInTheDocument();
    expect(screen.getByText('Moyen')).toBeInTheDocument();
    expect(screen.getByText('Difficile')).toBeInTheDocument();
  });

  it('disables add-bot buttons once the lobby is full', () => {
    const fullGame: Game = { ...privateGame, max_players: 2 };
    const mockClient = { setReady: vi.fn(), startGame: vi.fn() } as unknown as GameClient;
    render(
      <LobbyView client={mockClient} game={fullGame} currentPlayerId="p1" onLeave={vi.fn()} />
    );

    expect(screen.getByText('Facile').closest('button')).toBeDisabled();
  });

  it('calls addBot with the chosen difficulty', () => {
    const addBot = vi.fn();
    const mockClient = { setReady: vi.fn(), startGame: vi.fn(), addBot } as unknown as GameClient;
    render(
      <LobbyView client={mockClient} game={privateGame} currentPlayerId="p1" onLeave={vi.fn()} />
    );

    fireEvent.click(screen.getByText('Difficile'));

    expect(addBot).toHaveBeenCalledWith('HARD');
  });

  it('shows a kick button on other players but not on the host itself', () => {
    const mockClient = { setReady: vi.fn(), startGame: vi.fn() } as unknown as GameClient;
    render(
      <LobbyView client={mockClient} game={privateGame} currentPlayerId="p1" onLeave={vi.fn()} />
    );

    expect(screen.getAllByLabelText('Exclure Guest')).toHaveLength(1);
    expect(screen.queryByLabelText('Exclure Host')).not.toBeInTheDocument();
  });

  it('calls removePlayer with the target id when the kick button is clicked', () => {
    const removePlayer = vi.fn();
    const mockClient = {
      setReady: vi.fn(),
      startGame: vi.fn(),
      removePlayer,
    } as unknown as GameClient;
    render(
      <LobbyView client={mockClient} game={privateGame} currentPlayerId="p1" onLeave={vi.fn()} />
    );

    fireEvent.click(screen.getByLabelText('Exclure Guest'));

    expect(removePlayer).toHaveBeenCalledWith('p2');
  });

  it('shows no host controls to a non-host player', () => {
    const mockClient = { setReady: vi.fn(), startGame: vi.fn() } as unknown as GameClient;
    render(
      <LobbyView client={mockClient} game={privateGame} currentPlayerId="p2" onLeave={vi.fn()} />
    );

    expect(screen.queryByText('Facile')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Exclure Host')).not.toBeInTheDocument();
  });

  it('shows no host controls in a quick game even for the listed host id', () => {
    const quickGame: Game = { ...privateGame, is_quick_game: true };
    const mockClient = { setReady: vi.fn(), startGame: vi.fn() } as unknown as GameClient;
    render(
      <LobbyView client={mockClient} game={quickGame} currentPlayerId="p1" onLeave={vi.fn()} />
    );

    expect(screen.queryByText('Facile')).not.toBeInTheDocument();
  });

  it('hides host controls once the lobby leaves WAITING for COUNTDOWN', () => {
    const countingDownGame: Game = { ...privateGame, state: 'COUNTDOWN' };
    const mockClient = { setReady: vi.fn(), startGame: vi.fn() } as unknown as GameClient;
    render(
      <LobbyView
        client={mockClient}
        game={countingDownGame}
        currentPlayerId="p1"
        onLeave={vi.fn()}
      />
    );

    expect(screen.queryByText('Facile')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Exclure Guest')).not.toBeInTheDocument();
  });

  it('shows no host controls when host_player_id is null even if currentPlayerId is also null', () => {
    const hostlessGame: Game = { ...privateGame, host_player_id: null };
    const mockClient = { setReady: vi.fn(), startGame: vi.fn() } as unknown as GameClient;
    render(
      <LobbyView client={mockClient} game={hostlessGame} currentPlayerId={null} onLeave={vi.fn()} />
    );

    expect(screen.queryByText('Facile')).not.toBeInTheDocument();
  });
});
