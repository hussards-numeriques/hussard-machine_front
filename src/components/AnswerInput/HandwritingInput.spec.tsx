import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HandwritingInput } from './HandwritingInput';

vi.mock('../../services/digit-recognition', () => ({
  digitRecognitionPort: { recognize: vi.fn() },
}));

import { digitRecognitionPort } from '../../services/digit-recognition';

beforeEach(() => {
  vi.mocked(digitRecognitionPort.recognize).mockResolvedValue(42);
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    fillStyle: '',
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
    lineJoin: '',
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  });
});

describe('HandwritingInput', () => {
  it('renders canvas, Effacer and Valider buttons', () => {
    render(<HandwritingInput onSubmit={vi.fn()} disabled={false} />);
    expect(screen.getByRole('button', { name: 'Effacer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Valider' })).toBeInTheDocument();
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('calls onSubmit with recognized number on Valider click', async () => {
    const onSubmit = vi.fn();
    render(<HandwritingInput onSubmit={onSubmit} disabled={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(42));
  });

  it('shows error message when recognition returns null', async () => {
    vi.mocked(digitRecognitionPort.recognize).mockResolvedValue(null);
    render(<HandwritingInput onSubmit={vi.fn()} disabled={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    await waitFor(() =>
      expect(screen.getByText('Impossible de lire, réessaie')).toBeInTheDocument()
    );
  });

  it('disables both buttons when disabled prop is true', () => {
    render(<HandwritingInput onSubmit={vi.fn()} disabled={true} />);
    expect(screen.getByRole('button', { name: 'Effacer' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled();
  });
});
