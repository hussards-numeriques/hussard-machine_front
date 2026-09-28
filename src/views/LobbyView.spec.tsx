import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LobbyView } from './LobbyView';
import type { Game } from '../types';
import type { GameClient } from '../services/GameClient';
import { digitRecognitionPort } from '../services/digit-recognition';

vi.mock('../services/digit-recognition', () => ({
  digitRecognitionPort: { recognizeNumber: vi.fn(), preload: vi.fn().mockResolvedValue(undefined) },
}));

const stubCoarsePointer = (matches: boolean) =>
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches }));

beforeEach(() => {
  localStorage.clear();
  vi.mocked(digitRecognitionPort.preload).mockClear();
  stubCoarsePointer(false);
});

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
    level: 'CP',
  };

  const mockClient = {
    setReady: vi.fn(),
    startGame: vi.fn(),
    setLaunchCountdownCallback: vi.fn(),
  } as unknown as GameClient;

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
    level: 'CP',
  };

  const mockClient = {
    setReady: vi.fn(),
    startGame: vi.fn(),
    setLaunchCountdownCallback: vi.fn(),
  } as unknown as GameClient;

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
    level: 'CP',
  };

  const mockClient = {
    setReady: vi.fn(),
    startGame: vi.fn(),
    setLaunchCountdownCallback: vi.fn(),
  } as unknown as GameClient;

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

  it('does not show the school level next to the player name', () => {
    render(
      <LobbyView client={mockClient} game={gameWithTitle} currentPlayerId="p1" onLeave={vi.fn()} />
    );

    expect(screen.queryByText('CP')).not.toBeInTheDocument();
  });
});

describe('LobbyView - host controls', () => {
  const privateGame: Game = {
    id: 'ABCD',
    state: 'WAITING',
    is_quick_game: false,
    host_player_id: 'p1',
    max_players: 3,
    level: 'CP',
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
    const mockClient = {
      setReady: vi.fn(),
      startGame: vi.fn(),
      setLaunchCountdownCallback: vi.fn(),
    } as unknown as GameClient;
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
    const mockClient = {
      setReady: vi.fn(),
      startGame: vi.fn(),
      setLaunchCountdownCallback: vi.fn(),
    } as unknown as GameClient;
    render(
      <LobbyView client={mockClient} game={fullGame} currentPlayerId="p1" onLeave={vi.fn()} />
    );

    expect(screen.getByText('Facile').closest('button')).toBeDisabled();
  });

  it('calls addBot with the chosen difficulty', () => {
    const addBot = vi.fn();
    const mockClient = {
      setReady: vi.fn(),
      startGame: vi.fn(),
      setLaunchCountdownCallback: vi.fn(),
      addBot,
    } as unknown as GameClient;
    render(
      <LobbyView client={mockClient} game={privateGame} currentPlayerId="p1" onLeave={vi.fn()} />
    );

    fireEvent.click(screen.getByText('Difficile'));

    expect(addBot).toHaveBeenCalledWith('HARD');
  });

  it('shows a kick button on other players but not on the host itself', () => {
    const mockClient = {
      setReady: vi.fn(),
      startGame: vi.fn(),
      setLaunchCountdownCallback: vi.fn(),
    } as unknown as GameClient;
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
      setLaunchCountdownCallback: vi.fn(),
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
    const mockClient = {
      setReady: vi.fn(),
      startGame: vi.fn(),
      setLaunchCountdownCallback: vi.fn(),
    } as unknown as GameClient;
    render(
      <LobbyView client={mockClient} game={privateGame} currentPlayerId="p2" onLeave={vi.fn()} />
    );

    expect(screen.queryByText('Facile')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Exclure Host')).not.toBeInTheDocument();
  });

  it('shows no host controls in a quick game even for the listed host id', () => {
    const quickGame: Game = { ...privateGame, is_quick_game: true };
    const mockClient = {
      setReady: vi.fn(),
      startGame: vi.fn(),
      setLaunchCountdownCallback: vi.fn(),
    } as unknown as GameClient;
    render(
      <LobbyView client={mockClient} game={quickGame} currentPlayerId="p1" onLeave={vi.fn()} />
    );

    expect(screen.queryByText('Facile')).not.toBeInTheDocument();
  });

  it('hides host controls once the lobby leaves WAITING for COUNTDOWN', () => {
    const countingDownGame: Game = { ...privateGame, state: 'COUNTDOWN' };
    const mockClient = {
      setReady: vi.fn(),
      startGame: vi.fn(),
      setLaunchCountdownCallback: vi.fn(),
    } as unknown as GameClient;
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
    const mockClient = {
      setReady: vi.fn(),
      startGame: vi.fn(),
      setLaunchCountdownCallback: vi.fn(),
    } as unknown as GameClient;
    render(
      <LobbyView client={mockClient} game={hostlessGame} currentPlayerId={null} onLeave={vi.fn()} />
    );

    expect(screen.queryByText('Facile')).not.toBeInTheDocument();
  });
});

describe('LobbyView - launch countdown', () => {
  const launchingGame: Game = {
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
    ],
    questions: [],
    current_question_index: -1,
    answers: [],
    start_time_current_question: null,
    host_player_id: null,
    max_players: 6,
    level: 'CP',
  };

  const renderLaunching = () => {
    const setReady = vi.fn();
    const setLaunchCountdownCallback = vi.fn();
    const mockClient = {
      setReady,
      startGame: vi.fn(),
      setLaunchCountdownCallback,
    } as unknown as GameClient;
    render(
      <LobbyView client={mockClient} game={launchingGame} currentPlayerId="p1" onLeave={vi.fn()} />
    );
    const pushSeconds = (seconds: number) =>
      act(() => setLaunchCountdownCallback.mock.calls[0][0](seconds));
    return { setReady, pushSeconds };
  };

  it('locks the ready button and never sends READY during the launch', () => {
    const { setReady } = renderLaunching();

    const lockedButton = screen.getByRole('button', { name: /C'est parti/ });
    expect(lockedButton).toBeDisabled();
    fireEvent.click(lockedButton);

    expect(setReady).not.toHaveBeenCalled();
    expect(screen.queryByText('Je ne suis plus prêt')).not.toBeInTheDocument();
  });

  it('shows the overlay driven by the server countdown, then GO', () => {
    const { pushSeconds } = renderLaunching();

    expect(screen.getByRole('status')).toHaveTextContent('Prêts ?');
    pushSeconds(3);
    expect(screen.getByRole('status')).toHaveTextContent('3');
    pushSeconds(0);
    expect(screen.getByRole('status')).toHaveTextContent('GO !');
  });

  it('shows no overlay while waiting', () => {
    const mockClient = {
      setReady: vi.fn(),
      startGame: vi.fn(),
      setLaunchCountdownCallback: vi.fn(),
    } as unknown as GameClient;
    render(
      <LobbyView
        client={mockClient}
        game={{ ...launchingGame, state: 'WAITING' }}
        currentPlayerId="p1"
        onLeave={vi.fn()}
      />
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('Je ne suis plus prêt')).toBeEnabled();
  });
});

describe('LobbyView - handwriting model preload', () => {
  const game: Game = {
    id: 'ABCD',
    state: 'WAITING',
    players: [],
    questions: [],
    current_question_index: -1,
    answers: [],
    start_time_current_question: null,
    host_player_id: null,
    max_players: 6,
    level: 'CP',
  };
  const client = { setLaunchCountdownCallback: vi.fn() } as unknown as GameClient;

  it('preloads the recognition model when auto resolves to handwriting on touch', () => {
    stubCoarsePointer(true);
    render(<LobbyView client={client} game={game} currentPlayerId={null} onLeave={vi.fn()} />);
    expect(digitRecognitionPort.preload).toHaveBeenCalled();
  });

  it('does not preload the model on desktop', () => {
    render(<LobbyView client={client} game={game} currentPlayerId={null} onLeave={vi.fn()} />);
    expect(digitRecognitionPort.preload).not.toHaveBeenCalled();
  });
});
