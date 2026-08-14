import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { PromotionAvailableToast } from './PromotionAvailableToast';

describe('PromotionAvailableToast', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(
      <MemoryRouter>
        <PromotionAvailableToast visible={false} />
      </MemoryRouter>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the promotion message with a link to the profile', () => {
    render(
      <MemoryRouter>
        <PromotionAvailableToast visible={true} />
      </MemoryRouter>
    );
    expect(screen.getByText(/tu peux monter de niveau/i)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/profile');
  });

  it('auto-dismisses after the timeout', () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter>
        <PromotionAvailableToast visible={true} />
      </MemoryRouter>
    );
    expect(screen.getByText(/tu peux monter de niveau/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.queryByText(/tu peux monter de niveau/i)).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
