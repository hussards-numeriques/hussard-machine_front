import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthModal } from './AuthModal';

const loginWithGoogle = vi.fn();

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    client: { loginWithGoogle },
    login: vi.fn(),
    register: vi.fn(),
  }),
}));

describe('AuthModal', () => {
  it('triggers google login when the google button is clicked', () => {
    render(<AuthModal onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Google/ }));

    expect(loginWithGoogle).toHaveBeenCalledTimes(1);
  });
});
