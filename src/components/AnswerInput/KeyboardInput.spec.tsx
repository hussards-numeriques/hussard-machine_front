import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardInput } from './KeyboardInput';

describe('KeyboardInput', () => {
  it('calls onSubmit with parsed integer on form submit', () => {
    const onSubmit = vi.fn();
    render(<KeyboardInput onSubmit={onSubmit} disabled={false} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '42' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(onSubmit).toHaveBeenCalledWith(42);
  });

  it('does not call onSubmit when disabled', () => {
    const onSubmit = vi.fn();
    render(<KeyboardInput onSubmit={onSubmit} disabled={true} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '42' } });
    fireEvent.click(screen.getByRole('button'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows "Réponse envoyée..." text on button when disabled', () => {
    render(<KeyboardInput onSubmit={vi.fn()} disabled={true} />);
    expect(screen.getByRole('button')).toHaveTextContent('Réponse envoyée...');
  });
});
