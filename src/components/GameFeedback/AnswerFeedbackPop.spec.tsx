import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AnswerFeedbackPop } from './AnswerFeedbackPop';

describe('AnswerFeedbackPop', () => {
  it('shows the earned points in green when correct', () => {
    // Given / When
    render(<AnswerFeedbackPop isCorrect pointsEarned={135} />);

    // Then
    expect(screen.getByText('+135')).toBeInTheDocument();
  });

  it('shows a miss label when wrong', () => {
    // Given / When
    render(<AnswerFeedbackPop isCorrect={false} pointsEarned={0} />);

    // Then
    expect(screen.getByText('Raté')).toBeInTheDocument();
  });

  it('fades out after about a second', () => {
    // Given
    vi.useFakeTimers();
    render(<AnswerFeedbackPop isCorrect pointsEarned={135} />);

    // When
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Then
    expect(screen.getByText('+135').className).toContain('opacity-0');
    vi.useRealTimers();
  });
});
