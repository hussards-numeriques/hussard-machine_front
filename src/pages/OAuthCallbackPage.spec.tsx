import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OAuthCallbackPage } from './OAuthCallbackPage';

const navigate = vi.fn();
const reloadUser = vi.fn().mockResolvedValue(undefined);
const setTokens = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({ client: { setTokens }, reloadUser }),
}));

const renderWithHash = (hash: string) => {
  window.location.hash = hash;
  return render(
    <MemoryRouter>
      <OAuthCallbackPage />
    </MemoryRouter>
  );
};

describe('OAuthCallbackPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
    window.location.hash = '';
  });

  it('stores tokens, reloads the user and navigates home on success', async () => {
    renderWithHash('#access_token=abc&refresh_token=def&token_type=bearer');

    await waitFor(() => {
      expect(setTokens).toHaveBeenCalledWith({
        access_token: 'abc',
        refresh_token: 'def',
        token_type: 'bearer',
      });
    });
    expect(reloadUser).toHaveBeenCalled();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/', { replace: true }));
  });

  it('shows an error message on error fragment', async () => {
    renderWithHash('#error=boom');

    expect(await screen.findByText(/boom/)).toBeInTheDocument();
    expect(setTokens).not.toHaveBeenCalled();
  });
});
