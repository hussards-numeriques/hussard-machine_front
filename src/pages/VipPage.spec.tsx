import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VipPage } from './VipPage';
import { ApiError } from '../services/http';

const mocks = vi.hoisted(() => ({
  isAuthenticated: false,
  authLoading: false,
  mutate: vi.fn(),
  isPending: false,
  isError: false,
  isSuccess: false,
  error: null as Error | null,
  data: undefined as { active: boolean; expires_at: string | null } | undefined,
}));

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    client: {},
    user: null,
    isAuthenticated: mocks.isAuthenticated,
    isLoading: mocks.authLoading,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    reloadUser: vi.fn(),
  }),
}));

vi.mock('../hooks/useSubscription', () => ({
  useRedeem: () => ({
    mutate: mocks.mutate,
    isPending: mocks.isPending,
    isError: mocks.isError,
    isSuccess: mocks.isSuccess,
    error: mocks.error,
    data: mocks.data,
  }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <VipPage />
    </MemoryRouter>
  );

describe('VipPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAuthenticated = false;
    mocks.authLoading = false;
    mocks.isPending = false;
    mocks.isError = false;
    mocks.isSuccess = false;
    mocks.error = null;
    mocks.data = undefined;
  });

  it('prompts login when not authenticated', () => {
    renderPage();
    expect(screen.getByText('Connecte-toi pour activer ton code.')).toBeInTheDocument();
  });

  it('submits the typed code', () => {
    mocks.isAuthenticated = true;
    renderPage();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'my-secret-code' } });
    fireEvent.click(screen.getByRole('button', { name: 'Activer' }));

    expect(mocks.mutate).toHaveBeenCalledWith('my-secret-code');
  });

  it('shows a success message with the expiry date once redeemed', async () => {
    mocks.isAuthenticated = true;
    mocks.isSuccess = true;
    mocks.data = { active: true, expires_at: '2027-08-11T12:00:00' };
    renderPage();

    await waitFor(() => expect(screen.getByText(/Abonnement activ./)).toBeInTheDocument());
  });

  it('shows an invalid code message on a 400 error', () => {
    mocks.isAuthenticated = true;
    mocks.isError = true;
    mocks.error = new ApiError(400, 'Failed to redeem code (400)');
    renderPage();

    expect(screen.getByText('Code invalide.')).toBeInTheDocument();
  });
});
