import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ParentalGate } from './ParentalGate';
import { PARENTAL_GATE_QUESTIONS, type ParentalGateQuestion } from '../../lib/parentalGate';

const renderGate = () => {
  const props = { onPass: vi.fn(), onCancel: vi.fn() };
  render(<ParentalGate {...props} />);
  return props;
};

const displayedQuestion = (): ParentalGateQuestion => {
  const question = PARENTAL_GATE_QUESTIONS.find((q) => screen.queryByText(q.prompt));
  if (!question) {
    throw new Error('No parental gate question displayed');
  }
  return question;
};

const answer = (value: string) => {
  fireEvent.change(screen.getByRole('textbox'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
};

describe('ParentalGate', () => {
  it('asks the visitor to fetch an adult', () => {
    renderGate();

    expect(screen.getByRole('dialog')).toHaveTextContent('Demande à un adulte');
    displayedQuestion();
  });

  it('lets the adult through with the right answer', () => {
    const props = renderGate();

    answer(String(displayedQuestion().answer));

    expect(props.onPass).toHaveBeenCalledTimes(1);
  });

  it('swaps the question and clears the input after a wrong answer', () => {
    const props = renderGate();
    const first = displayedQuestion();

    answer('0');

    expect(props.onPass).not.toHaveBeenCalled();
    expect(displayedQuestion()).not.toBe(first);
    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(screen.getByText('Mauvaise réponse, essaie avec cette question.')).toBeInTheDocument();
  });

  it('cancels from the button and from the backdrop', () => {
    const props = renderGate();

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement);

    expect(props.onCancel).toHaveBeenCalledTimes(2);
  });
});
