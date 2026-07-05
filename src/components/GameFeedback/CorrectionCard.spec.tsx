import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CorrectionCard } from './CorrectionCard';
import type { Game } from '../../types';

const game = (answers: Game['answers']): Game => ({
  id: 'G1',
  state: 'IN_PROGRESS',
  players: [],
  questions: [
    {
      id: 'q1',
      statement: '7 x 8',
      answer: 56,
      category: 'multiplication',
      time_limit_seconds: 10,
    },
  ],
  current_question_index: 0,
  answers,
  start_time_current_question: null,
});

describe('CorrectionCard', () => {
  it('shows the given answer in success state with the earned points', () => {
    // Given
    const g = game([
      {
        player_id: 'p1',
        question_id: 'q1',
        value: 56,
        timestamp: 0,
        is_correct: true,
        points_earned: 135,
      },
    ]);

    // When
    render(<CorrectionCard game={g} playerId="p1" questionIndex={0} countdown={3} />);

    // Then
    expect(screen.getByText('Bonne réponse')).toBeInTheDocument();
    expect(screen.getByText('56')).toBeInTheDocument();
    expect(screen.getByText('+135')).toBeInTheDocument();
  });

  it('shows the wrong given answer and the expected answer on failure', () => {
    // Given
    const g = game([
      {
        player_id: 'p1',
        question_id: 'q1',
        value: 54,
        timestamp: 0,
        is_correct: false,
        points_earned: 0,
      },
    ]);

    // When
    render(<CorrectionCard game={g} playerId="p1" questionIndex={0} countdown={3} />);

    // Then
    expect(screen.getByText('Mauvaise réponse')).toBeInTheDocument();
    expect(screen.getByText('54')).toBeInTheDocument();
    expect(screen.getByText('56')).toBeInTheDocument();
  });

  it('shows a no-answer state on timeout', () => {
    // Given
    const g = game([]);

    // When
    render(<CorrectionCard game={g} playerId="p1" questionIndex={0} countdown={2} />);

    // Then
    expect(screen.getByText('Temps écoulé')).toBeInTheDocument();
    expect(screen.getByText('⏱ Pas de réponse')).toBeInTheDocument();
    expect(screen.getByText('56')).toBeInTheDocument();
  });
});
