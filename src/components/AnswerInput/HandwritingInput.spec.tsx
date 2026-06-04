import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { HandwritingInput } from './HandwritingInput';

vi.mock('../../services/digit-recognition', () => ({
  digitRecognitionPort: { recognizeDigit: vi.fn() },
}));

import { digitRecognitionPort } from '../../services/digit-recognition';

const ctxStub = {
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
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
};

beforeEach(() => {
  vi.useFakeTimers();
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(ctxStub);
  HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
  vi.mocked(digitRecognitionPort.recognizeDigit).mockResolvedValue(0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

async function drawDigit(canvas: HTMLCanvasElement) {
  fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
  fireEvent.pointerMove(canvas, { clientX: 20, clientY: 20, pointerId: 1 });
  fireEvent.pointerUp(canvas, { pointerId: 1 });
  await act(async () => {
    await vi.runAllTimersAsync();
  });
}

describe('HandwritingInput', () => {
  it('renders the sign, backspace, clear and submit controls', () => {
    render(<HandwritingInput onSubmit={vi.fn()} disabled={false} />);
    expect(screen.getByRole('button', { name: 'Valider' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '±' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '⌫' })).toBeInTheDocument();
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('appends each recognized digit to the running answer', async () => {
    vi.mocked(digitRecognitionPort.recognizeDigit)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);
    render(<HandwritingInput onSubmit={vi.fn()} disabled={false} />);
    const canvas = document.querySelector('canvas')!;
    await drawDigit(canvas);
    await drawDigit(canvas);
    expect(screen.getByTestId('current-answer')).toHaveTextContent('42');
  });

  it('submits the parsed positive number', async () => {
    const onSubmit = vi.fn();
    vi.mocked(digitRecognitionPort.recognizeDigit).mockResolvedValueOnce(7);
    render(<HandwritingInput onSubmit={onSubmit} disabled={false} />);
    await drawDigit(document.querySelector('canvas')!);
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(onSubmit).toHaveBeenCalledWith(7);
  });

  it('applies the negative sign on submit', async () => {
    const onSubmit = vi.fn();
    vi.mocked(digitRecognitionPort.recognizeDigit)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);
    render(<HandwritingInput onSubmit={onSubmit} disabled={false} />);
    const canvas = document.querySelector('canvas')!;
    await drawDigit(canvas);
    await drawDigit(canvas);
    fireEvent.click(screen.getByRole('button', { name: '±' }));
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(onSubmit).toHaveBeenCalledWith(-42);
  });

  it('removes the last digit on backspace', async () => {
    vi.mocked(digitRecognitionPort.recognizeDigit)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);
    render(<HandwritingInput onSubmit={vi.fn()} disabled={false} />);
    const canvas = document.querySelector('canvas')!;
    await drawDigit(canvas);
    await drawDigit(canvas);
    fireEvent.click(screen.getByRole('button', { name: '⌫' }));
    expect(screen.getByTestId('current-answer')).toHaveTextContent('4');
  });

  it('shows an error and adds no digit when recognition returns null', async () => {
    vi.mocked(digitRecognitionPort.recognizeDigit).mockResolvedValueOnce(null);
    render(<HandwritingInput onSubmit={vi.fn()} disabled={false} />);
    await drawDigit(document.querySelector('canvas')!);
    expect(screen.getByText('Impossible de lire, réessaie')).toBeInTheDocument();
    expect(screen.getByTestId('current-answer')).toHaveTextContent('');
  });

  it('does not submit an empty answer', () => {
    const onSubmit = vi.fn();
    render(<HandwritingInput onSubmit={onSubmit} disabled={false} />);
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled();
  });

  it('disables controls when disabled prop is true', () => {
    render(<HandwritingInput onSubmit={vi.fn()} disabled={true} />);
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled();
  });
});
