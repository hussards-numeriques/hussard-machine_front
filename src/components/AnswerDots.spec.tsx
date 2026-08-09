import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnswerDots } from './AnswerDots';

describe('AnswerDots', () => {
  it('renders one dot per result', () => {
    render(<AnswerDots results={['correct', 'incorrect', 'timeout']} maxWidthCh={8} />);
    expect(screen.getByTestId('answer-dots').querySelectorAll('[data-testid="dot"]')).toHaveLength(
      3
    );
  });

  it('maps each result to the matching dot color', () => {
    render(<AnswerDots results={['correct', 'incorrect', 'timeout']} maxWidthCh={8} />);
    const dots = screen.getByTestId('answer-dots').querySelectorAll('[data-testid="dot"]');
    expect(dots[0]).toHaveClass('bg-emerald-500');
    expect(dots[1]).toHaveClass('bg-red-400');
    expect(dots[2]).toHaveClass('bg-slate-300');
  });

  it('applies maxWidthCh as an inline max-width in ch units', () => {
    render(<AnswerDots results={['correct']} maxWidthCh={8} />);
    expect(screen.getByTestId('answer-dots')).toHaveStyle({ maxWidth: '8ch' });
  });

  it('renders nothing when there are no results', () => {
    const { container } = render(<AnswerDots results={[]} maxWidthCh={8} />);
    expect(container.firstChild).toBeNull();
  });

  it('exposes an accessible label for each result', () => {
    render(<AnswerDots results={['correct', 'incorrect', 'timeout']} maxWidthCh={8} />);
    expect(screen.getByRole('img', { name: 'Correcte' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Incorrecte' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Sans réponse' })).toBeInTheDocument();
  });
});
