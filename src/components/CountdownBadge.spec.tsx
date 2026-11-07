import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CountdownBadge } from './CountdownBadge';

const play = vi.fn();

vi.mock('../hooks/useSound', () => ({
  useSound: () => play,
}));

describe('CountdownBadge', () => {
  beforeEach(() => {
    play.mockClear();
  });

  it('shows the remaining seconds without alert above 3 seconds', () => {
    render(<CountdownBadge remainingSeconds={4} ticking />);
    expect(screen.getByText('4s')).not.toHaveClass('text-red-500');
    expect(play).not.toHaveBeenCalled();
  });

  it('turns red and ticks at 3 seconds', () => {
    render(<CountdownBadge remainingSeconds={3} ticking />);
    expect(screen.getByText('3s')).toHaveClass('text-red-500');
    expect(play).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledWith('tick');
  });

  it('does not tick when not ticking', () => {
    render(<CountdownBadge remainingSeconds={3} ticking={false} />);
    expect(play).not.toHaveBeenCalled();
  });

  it('does not tick at zero', () => {
    render(<CountdownBadge remainingSeconds={0} ticking />);
    expect(play).not.toHaveBeenCalled();
  });

  it('ticks again each time the remaining seconds change', () => {
    const { rerender } = render(<CountdownBadge remainingSeconds={3} ticking />);
    rerender(<CountdownBadge remainingSeconds={2} ticking />);
    expect(play).toHaveBeenCalledTimes(2);
  });
});
