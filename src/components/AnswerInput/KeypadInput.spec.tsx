import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeypadInput } from './KeypadInput';

const press = (label: string) => fireEvent.click(screen.getByRole('button', { name: label }));

describe('KeypadInput', () => {
  it('submits the typed positive number', () => {
    const onSubmit = vi.fn();
    render(<KeypadInput onSubmit={onSubmit} disabled={false} />);
    press('4');
    press('2');
    press('Valider');
    expect(onSubmit).toHaveBeenCalledWith(42);
  });

  it('applies the negative sign', () => {
    const onSubmit = vi.fn();
    render(<KeypadInput onSubmit={onSubmit} disabled={false} />);
    press('7');
    press('±');
    press('Valider');
    expect(onSubmit).toHaveBeenCalledWith(-7);
  });

  it('removes the last digit with backspace', () => {
    const onSubmit = vi.fn();
    render(<KeypadInput onSubmit={onSubmit} disabled={false} />);
    press('1');
    press('2');
    press('Effacer');
    press('Valider');
    expect(onSubmit).toHaveBeenCalledWith(1);
  });

  it('does not submit when empty', () => {
    const onSubmit = vi.fn();
    render(<KeypadInput onSubmit={onSubmit} disabled={false} />);
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled();
    press('Valider');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables inputs when disabled', () => {
    const onSubmit = vi.fn();
    render(<KeypadInput onSubmit={onSubmit} disabled={true} />);
    expect(screen.getByRole('button', { name: '5' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '±' })).toBeDisabled();
  });

  it('resets state when transitioning from disabled to enabled', () => {
    const onSubmit = vi.fn();
    const { rerender } = render(<KeypadInput onSubmit={onSubmit} disabled={false} />);
    press('5');
    press('3');
    press('±');
    expect(screen.getByTestId('current-answer')).toHaveTextContent('−53');
    rerender(<KeypadInput onSubmit={onSubmit} disabled={true} />);
    rerender(<KeypadInput onSubmit={onSubmit} disabled={false} />);
    expect(screen.getByTestId('current-answer')).toHaveTextContent('');
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled();
  });
});
