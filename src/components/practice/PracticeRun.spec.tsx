import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import confetti from 'canvas-confetti';
import { MemoryRouter } from 'react-router-dom';
import { PracticeRun } from './PracticeRun';
import {
  startSeries,
  type PendingAnswer,
  type PracticeSeries,
  type SeriesLength,
} from '../../lib/practice';

interface QuestionState {
  data: { prompt: string; answer: number } | undefined;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const questionState: QuestionState = {
  data: { prompt: '6 x 3', answer: 18 },
  isError: false,
  error: null,
  refetch: vi.fn(),
};

vi.mock('../../hooks/usePractice', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../hooks/usePractice')>()),
  usePracticeQuestion: () => questionState,
}));

vi.mock('canvas-confetti', () => ({ default: Object.assign(vi.fn(), { reset: vi.fn() }) }));

vi.mock('../../contexts/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: false, isLoading: false }),
}));

const buildSeries = (
  timeLimitSeconds: number | null,
  pending: PendingAnswer | null = null,
  answered = 0
): PracticeSeries => ({
  ...startSeries(
    { kind: 'notion', level: 'CE2', category: 'addition', promptType: 'addition' },
    5 as SeriesLength,
    1,
    timeLimitSeconds
  ),
  outcomes: Array.from({ length: answered }, () => 'correct' as const),
  pending,
});

describe('PracticeRun time limit', () => {
  const onTimeOut = vi.fn();

  const onNext = vi.fn();

  const runElement = (series: PracticeSeries) => (
    <MemoryRouter>
      <PracticeRun
        series={series}
        onAnswer={vi.fn()}
        onNext={onNext}
        onQuit={vi.fn()}
        onTimeOut={onTimeOut}
      />
    </MemoryRouter>
  );

  const renderRun = (series: PracticeSeries) => render(runElement(series));

  const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

  beforeEach(() => {
    vi.useFakeTimers();
    onTimeOut.mockClear();
    onNext.mockClear();
    questionState.data = { prompt: '6 x 3', answer: 18 };
    questionState.isError = false;
    questionState.error = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not show a clock without a time limit', () => {
    renderRun(buildSeries(null));
    advance(5000);
    expect(screen.queryByText(/^\d+s$/)).not.toBeInTheDocument();
    expect(onTimeOut).not.toHaveBeenCalled();
  });

  it('times out when the limit is reached', () => {
    renderRun(buildSeries(2));
    advance(1900);
    expect(onTimeOut).not.toHaveBeenCalled();
    advance(350);
    expect(onTimeOut).toHaveBeenCalledTimes(1);
  });

  it('does not run the clock while the question loads', () => {
    questionState.data = undefined;
    const series = buildSeries(2);
    const { rerender } = renderRun(series);
    advance(5000);
    expect(onTimeOut).not.toHaveBeenCalled();

    questionState.data = { prompt: '6 x 3', answer: 18 };
    rerender(runElement(series));
    advance(1900);
    expect(onTimeOut).not.toHaveBeenCalled();
    advance(350);
    expect(onTimeOut).toHaveBeenCalledTimes(1);
  });

  it('does not run the clock on a failed question', () => {
    questionState.data = undefined;
    questionState.isError = true;
    questionState.error = new Error('boom');
    renderRun(buildSeries(2));
    advance(5000);
    expect(onTimeOut).not.toHaveBeenCalled();
  });

  it('stops the clock once answered', () => {
    renderRun(buildSeries(2, { kind: 'answered', given: 18, outcome: 'correct' }));
    advance(5000);
    expect(onTimeOut).not.toHaveBeenCalled();
  });

  it('restarts the clock on the next question', () => {
    const { rerender } = renderRun(buildSeries(2));
    advance(1500);
    rerender(runElement(buildSeries(2, null, 1)));
    advance(1500);
    expect(onTimeOut).not.toHaveBeenCalled();
  });

  it('clears the confetti when leaving the cheer', () => {
    vi.mocked(confetti.reset).mockClear();
    const { rerender } = renderRun(
      buildSeries(null, { kind: 'answered', given: 18, outcome: 'correct' })
    );
    expect(confetti.reset).not.toHaveBeenCalled();
    rerender(runElement(buildSeries(null, null, 1)));
    expect(confetti.reset).toHaveBeenCalledTimes(1);
  });

  it('shows the correction when time is up', () => {
    renderRun(buildSeries(2, { kind: 'timedOut' }));
    expect(screen.getByText('Temps écoulé !')).toBeInTheDocument();
    expect(screen.getByTestId('practice-correction')).toHaveTextContent('18');
    expect(screen.queryByText('Ta réponse')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('shows the clock when a limit is set', () => {
    renderRun(buildSeries(10));
    expect(screen.getByText(/^\d+s$/)).toBeInTheDocument();
  });

  it('locks the next button briefly after a timeout', () => {
    renderRun(buildSeries(2, { kind: 'timedOut' }));
    const next = screen.getByRole('button', { name: 'Question suivante' });
    expect(next).toBeDisabled();
    expect(next).not.toHaveFocus();
    fireEvent.click(next);
    advance(799);
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Question suivante' })).toBeDisabled();

    advance(1);
    const unlocked = screen.getByRole('button', { name: 'Question suivante' });
    expect(unlocked).toBeEnabled();
    expect(unlocked).toHaveFocus();
    fireEvent.click(unlocked);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('enables the next button immediately after a wrong answer', () => {
    renderRun(buildSeries(2, { kind: 'answered', given: 5, outcome: 'incorrect' }));
    const next = screen.getByRole('button', { name: 'Question suivante' });
    expect(next).toBeEnabled();
    expect(next).toHaveFocus();
  });
});
