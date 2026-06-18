import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
