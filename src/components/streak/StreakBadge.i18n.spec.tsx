import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthContext, type AuthContextValue } from '../../contexts/AuthContext';
import { StreakContext } from '../../contexts/StreakContext';
import i18n from '../../i18n';
import { StreakBadge } from './StreakBadge';

const authValue: AuthContextValue = {
  client: {} as AuthContextValue['client'],
  user: { username: 'Tim' } as AuthContextValue['user'],
  isAuthenticated: true,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  clearSession: () => {},
  reloadUser: async () => {},
};

describe('StreakBadge i18n', () => {
  it('renders the popover in English', async () => {
    await i18n.changeLanguage('en');
    render(
      <AuthContext.Provider value={authValue}>
        <StreakContext.Provider
          value={{
            streak: { current_count: 12, played_today: true, freeze_available_on: null },
            isLoading: false,
            refresh: async () => {},
          }}
        >
          <MemoryRouter>
            <StreakBadge />
          </MemoryRouter>
        </StreakContext.Provider>
      </AuthContext.Provider>
    );
    fireEvent.click(screen.getByRole('button', { name: /daily quest/i }));
    expect(screen.getByText('12 days')).toBeInTheDocument();
    expect(screen.getByText(/your flame evolves in 2 days/i)).toBeInTheDocument();
  });
});
