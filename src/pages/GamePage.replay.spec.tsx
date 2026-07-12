import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GamePage } from './GamePage';
import { GameContext, type GameContextValue } from '../contexts/GameContext';
import type { GameClient } from '../services/GameClient';
import type { Game } from '../types';

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    client: { authorizedFetch: vi.fn() },
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    reloadUser: vi.fn(),
  }),
}));

const ReplayTrigger: React.FC = () => {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate('/game', { state: { playerName: 'Alice', token: null } })}>
      Replay
    </button>
  );
};

describe('GamePage - reconnecting on same-path navigation (replay)', () => {
  it('re-connects when navigating to /game again with the same player name/token', () => {
    const connectToQuickGame = vi.fn();
    const resetGame = vi.fn();
    const game: Game = {
      id: 'G1',
      state: 'WAITING',
      players: [],
      questions: [],
      current_question_index: -1,
      answers: [],
      start_time_current_question: null,
    };
    const client = {
      connectToQuickGame,
      connectToLobby: vi.fn(),
      disconnect: vi.fn(),
      getPlayerId: vi.fn().mockReturnValue(null),
    } as unknown as GameClient;

    const contextValue: GameContextValue = {
      client,
      game,
      error: null,
      clearError: vi.fn(),
      resetGame,
    };

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={[{ pathname: '/game', state: { playerName: 'Alice', token: null } }]}
        >
          <GameContext.Provider value={contextValue}>
            <Routes>
              <Route path="/game" element={<GamePage />} />
            </Routes>
            <ReplayTrigger />
          </GameContext.Provider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(connectToQuickGame).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Replay'));

    expect(connectToQuickGame).toHaveBeenCalledTimes(2);
  });
});
