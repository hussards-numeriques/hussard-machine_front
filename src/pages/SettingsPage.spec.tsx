import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from './SettingsPage';
import { ANSWER_INPUT_MODE_STORAGE_KEY } from '../hooks/useAnswerInputMode';

const mocks = vi.hoisted(() => ({ isAuthenticated: true }));

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    client: {},
    user: { username: 'Tim' },
    isAuthenticated: mocks.isAuthenticated,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    reloadUser: vi.fn(),
  }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>
  );

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.isAuthenticated = true;
  });

  it('shows a notice when not authenticated', () => {
    mocks.isAuthenticated = false;
    renderPage();
    expect(screen.getByText(/Connecte-toi/i)).toBeInTheDocument();
  });

  it('persists the selected mode', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Pavé numérique/i }));
    expect(localStorage.getItem(ANSWER_INPUT_MODE_STORAGE_KEY)).toBe('keypad');
  });
});
