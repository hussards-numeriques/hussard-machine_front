import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HandwritingInput } from './HandwritingInput';

vi.mock('../../services/digit-recognition', () => ({
  digitRecognitionPort: { recognizeNumber: vi.fn(), preload: vi.fn() },
}));

import { digitRecognitionPort } from '../../services/digit-recognition';

const authMocks = vi.hoisted(() => ({ isAuthenticated: false }));

vi.mock('../../contexts/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: authMocks.isAuthenticated }),
}));

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
  authMocks.isAuthenticated = false;
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(ctxStub);
  HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
  vi.mocked(digitRecognitionPort.recognizeNumber).mockResolvedValue(0);
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

const renderInput = (onSubmit = vi.fn(), disabled = false) =>
  render(
    <MemoryRouter>
      <HandwritingInput onSubmit={onSubmit} disabled={disabled} />
    </MemoryRouter>
  );

async function drawNumber(canvas: HTMLCanvasElement) {
  fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
  fireEvent.pointerMove(canvas, { clientX: 20, clientY: 20, pointerId: 1 });
  fireEvent.pointerUp(canvas, { pointerId: 1 });
  await act(async () => {
    await vi.runAllTimersAsync();
  });
}

const stroke = (canvas: HTMLCanvasElement) => {
  fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
  fireEvent.pointerUp(canvas, { pointerId: 1 });
};

const flush = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });

describe('HandwritingInput', () => {
  it('renders the sign, clear and submit controls', () => {
    renderInput();
    expect(screen.getByRole('button', { name: 'Valider' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '±' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Effacer' })).toBeInTheDocument();
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('shows the experimental badge without the settings hint for an anonymous player', () => {
    authMocks.isAuthenticated = false;
    renderInput();
    expect(screen.getByTestId('handwriting-beta-badge')).toHaveTextContent(/^🧪 Expérimental$/);
  });

  it('mentions that the mode can be changed in settings for an authenticated player', () => {
    authMocks.isAuthenticated = true;
    renderInput();
    expect(screen.getByTestId('handwriting-beta-badge')).toHaveTextContent(
      '🧪 Expérimental · modifiable dans Réglages'
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('maps pointer coords to the backing store when displayed size differs', () => {
    renderInput();
    const canvas = document.querySelector('canvas')!;
    // Backing store 400x200 affiche sur 200x100 (facteur 2) : le doigt a 100,50
    // en pixels affiches doit tomber a 200,100 dans le backing store.
    canvas.getBoundingClientRect = vi.fn(
      () => ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect
    );
    fireEvent.pointerDown(canvas, { clientX: 100, clientY: 50, pointerId: 1 });
    expect(ctxStub.moveTo).toHaveBeenCalledWith(200, 100);
  });

  it('displays the recognized number in a single pass', async () => {
    vi.mocked(digitRecognitionPort.recognizeNumber).mockResolvedValueOnce(123);
    renderInput();
    await drawNumber(document.querySelector('canvas')!);
    expect(screen.getByTestId('current-answer')).toHaveTextContent('123');
  });

  it('replaces the previous result when recognizing again', async () => {
    vi.mocked(digitRecognitionPort.recognizeNumber)
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(345);
    renderInput();
    const canvas = document.querySelector('canvas')!;
    await drawNumber(canvas);
    expect(screen.getByTestId('current-answer')).toHaveTextContent('12');
    await drawNumber(canvas);
    expect(screen.getByTestId('current-answer')).toHaveTextContent('345');
  });

  it('submits the parsed positive number', async () => {
    const onSubmit = vi.fn();
    vi.mocked(digitRecognitionPort.recognizeNumber).mockResolvedValueOnce(7);
    renderInput(onSubmit);
    await drawNumber(document.querySelector('canvas')!);
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(onSubmit).toHaveBeenCalledWith(7);
  });

  it('applies the negative sign on submit', async () => {
    const onSubmit = vi.fn();
    vi.mocked(digitRecognitionPort.recognizeNumber).mockResolvedValueOnce(42);
    renderInput(onSubmit);
    await drawNumber(document.querySelector('canvas')!);
    fireEvent.click(screen.getByRole('button', { name: '±' }));
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(onSubmit).toHaveBeenCalledWith(-42);
  });

  it('clears the recognized number', async () => {
    vi.mocked(digitRecognitionPort.recognizeNumber).mockResolvedValueOnce(42);
    renderInput();
    const canvas = document.querySelector('canvas')!;
    await drawNumber(canvas);
    expect(screen.getByTestId('current-answer')).toHaveTextContent('42');
    fireEvent.click(screen.getByRole('button', { name: 'Effacer' }));
    expect(screen.getByTestId('current-answer')).toHaveTextContent('');
  });

  it('shows an error and sets no result when recognition returns null', async () => {
    vi.mocked(digitRecognitionPort.recognizeNumber).mockResolvedValueOnce(null);
    renderInput();
    await drawNumber(document.querySelector('canvas')!);
    expect(screen.getByText('Impossible de lire, réessaie')).toBeInTheDocument();
    expect(screen.getByTestId('current-answer')).toHaveTextContent('');
  });

  it('does not submit an empty answer', () => {
    const onSubmit = vi.fn();
    renderInput(onSubmit);
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled();
  });

  it('disables controls when disabled prop is true', () => {
    renderInput(vi.fn(), true);
    expect(screen.getByRole('button', { name: 'Valider' })).toBeDisabled();
  });

  describe('validating before recognition has finished', () => {
    const valider = () => screen.getByRole('button', { name: 'Valider' });

    it('validates a first stroke right away', async () => {
      const onSubmit = vi.fn();
      vi.mocked(digitRecognitionPort.recognizeNumber).mockResolvedValueOnce(7);
      renderInput(onSubmit);
      stroke(document.querySelector('canvas')!);
      expect(valider()).toBeEnabled();
      fireEvent.click(valider());
      await flush();
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(7);
    });

    it('submits the new drawing, never the previous value', async () => {
      const onSubmit = vi.fn();
      vi.mocked(digitRecognitionPort.recognizeNumber)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(42);
      renderInput(onSubmit);
      const canvas = document.querySelector('canvas')!;
      await drawNumber(canvas);
      stroke(canvas);
      fireEvent.click(valider());
      await flush();
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(42);
    });

    it('waits for a recognition already running and submits once', async () => {
      const onSubmit = vi.fn();
      let finish: (value: number) => void = () => {};
      vi.mocked(digitRecognitionPort.recognizeNumber).mockReturnValueOnce(
        new Promise((resolve) => {
          finish = resolve;
        })
      );
      renderInput(onSubmit);
      stroke(document.querySelector('canvas')!);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(700);
      });
      fireEvent.click(valider());
      fireEvent.click(valider());
      expect(onSubmit).not.toHaveBeenCalled();
      await act(async () => {
        finish(12);
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(12);
    });

    it('shows the error and keeps no value when the drawing is unreadable', async () => {
      const onSubmit = vi.fn();
      vi.mocked(digitRecognitionPort.recognizeNumber)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(null);
      renderInput(onSubmit);
      const canvas = document.querySelector('canvas')!;
      await drawNumber(canvas);
      stroke(canvas);
      fireEvent.click(valider());
      await flush();
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByTestId('current-answer')).toHaveTextContent('');
      expect(valider()).toBeDisabled();
    });

    it('does not submit once unmounted', async () => {
      const onSubmit = vi.fn();
      let finish: (value: number) => void = () => {};
      vi.mocked(digitRecognitionPort.recognizeNumber).mockReturnValueOnce(
        new Promise((resolve) => {
          finish = resolve;
        })
      );
      const { unmount } = renderInput(onSubmit);
      stroke(document.querySelector('canvas')!);
      fireEvent.click(valider());
      unmount();
      await act(async () => {
        finish(12);
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not submit when cleared during recognition', async () => {
      const onSubmit = vi.fn();
      let finish: (value: number) => void = () => {};
      vi.mocked(digitRecognitionPort.recognizeNumber).mockReturnValueOnce(
        new Promise((resolve) => {
          finish = resolve;
        })
      );
      renderInput(onSubmit);
      stroke(document.querySelector('canvas')!);
      fireEvent.click(valider());
      fireEvent.click(screen.getByRole('button', { name: 'Effacer' }));
      await act(async () => {
        finish(12);
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByTestId('current-answer')).toHaveTextContent('');
    });
  });
});
