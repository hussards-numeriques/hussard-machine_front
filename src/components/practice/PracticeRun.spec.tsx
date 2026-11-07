import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
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

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

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

  const renderRun = (series: PracticeSeries) =>
    render(
      <MemoryRouter>
        <PracticeRun
          series={series}
          onAnswer={vi.fn()}
          onNext={vi.fn()}
          onQuit={vi.fn()}
          onTimeOut={onTimeOut}
        />
      </MemoryRouter>
    );

  const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

  beforeEach(() => {
    vi.useFakeTimers();
    onTimeOut.mockClear();
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
    rerender(
      <MemoryRouter>
        <PracticeRun
          series={series}
          onAnswer={vi.fn()}
          onNext={vi.fn()}
          onQuit={vi.fn()}
          onTimeOut={onTimeOut}
        />
      </MemoryRouter>
    );
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
    rerender(
      <MemoryRouter>
        <PracticeRun
          series={buildSeries(2, null, 1)}
          onAnswer={vi.fn()}
          onNext={vi.fn()}
          onQuit={vi.fn()}
          onTimeOut={onTimeOut}
        />
      </MemoryRouter>
    );
    advance(1500);
    expect(onTimeOut).not.toHaveBeenCalled();
  });

  it('shows the correction when time is up', () => {
    renderRun(buildSeries(2, { kind: 'timedOut' }));
    expect(screen.getByText('Temps écoulé !')).toBeInTheDocument();
    expect(screen.getByTestId('practice-correction')).toHaveTextContent('18');
    expect(screen.queryByText('Ta réponse')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
