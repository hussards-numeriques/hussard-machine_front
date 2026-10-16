import { fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PracticePage } from './PracticePage';
import { renderWithQueryClient } from '../test-utils';
import { ApiError } from '../services/http';
import type { PracticeCatalog, PracticeQuestion } from '../services/practice';

const mocks = vi.hoisted(() => ({
  active: true,
  fetchCatalog: vi.fn(),
  fetchQuestion: vi.fn(),
}));

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    client: { authorizedFetch: vi.fn() },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock('../hooks/useSubscription', () => ({
  SUBSCRIPTION_STATUS_QUERY_KEY: ['subscription-status'],
  useSubscriptionStatus: () => ({
    data: { active: mocks.active, expires_at: null },
    isLoading: false,
  }),
}));

vi.mock('../hooks/usePlayerProfile', () => ({
  usePlayerProfile: () => ({ data: { level: 'CM1' } }),
}));

vi.mock('../services/practice', () => ({
  fetchPracticeCatalog: mocks.fetchCatalog,
  fetchPracticeQuestion: mocks.fetchQuestion,
}));

const catalog: PracticeCatalog = {
  CP: { addition: ['addition'] },
  CM1: {
    division: ['division_table', 'division'],
    double: ['double'],
  },
};

const doubleOf = (value: number): PracticeQuestion => ({
  prompt: { type: 'double', value },
  answer: value * 2,
});

const renderPage = () =>
  renderWithQueryClient(
    <MemoryRouter initialEntries={['/practice']}>
      <Routes>
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/subscription" element={<div>Subscription page</div>} />
      </Routes>
    </MemoryRouter>
  );

const answer = async (value: number) => {
  fireEvent.change(await screen.findByPlaceholderText('?'), { target: { value: String(value) } });
  fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
};

describe('PracticePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.active = true;
    mocks.fetchCatalog.mockResolvedValue(catalog);
    let value = 0;
    mocks.fetchQuestion.mockImplementation(async () => doubleOf(++value));
  });

  it('redirects a non-subscriber to the subscription page', () => {
    mocks.active = false;
    renderPage();
    expect(screen.getByText('Subscription page')).toBeInTheDocument();
  });

  it('redirects to the subscription page when the back says it expired', async () => {
    mocks.fetchCatalog.mockRejectedValue(new ApiError(403, 'expired', 'SUBSCRIPTION_REQUIRED'));
    renderPage();
    expect(await screen.findByText('Subscription page')).toBeInTheDocument();
  });

  it('preselects the player level and asks for a notion only when needed', async () => {
    renderPage();

    expect(await screen.findByLabelText('Niveau')).toHaveValue('CM1');
    const start = screen.getByRole('button', { name: "C'est parti !" });
    expect(start).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Division/ }));
    expect(screen.getByText('Choisis une notion.')).toBeInTheDocument();
    expect(start).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Tables de division' }));
    expect(start).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: /Double/ }));
    expect(screen.queryByText('Notion')).not.toBeInTheDocument();
    expect(start).toBeEnabled();
  });

  it('plays a series, cheers, corrects calmly and scores at the end', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Double/ }));
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    fireEvent.click(screen.getByRole('button', { name: "C'est parti !" }));

    expect(await screen.findByText('Question 1 sur 5')).toBeInTheDocument();
    await answer(2);
    expect(screen.getByText('Bravo !')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Question suivante' }));

    expect(await screen.findByText('Question 2 sur 5')).toBeInTheDocument();
    await answer(5);
    expect(screen.getByText('Pas tout à fait…')).toBeInTheDocument();
    expect(screen.getByTestId('practice-correction')).toHaveTextContent('4');
    fireEvent.click(screen.getByRole('button', { name: 'Question suivante' }));

    for (const value of [6, 8]) {
      await answer(value);
      fireEvent.click(screen.getByRole('button', { name: 'Question suivante' }));
    }
    await answer(10);
    fireEvent.click(screen.getByRole('button', { name: 'Voir mon résultat' }));

    expect(screen.getByText('Série terminée !')).toBeInTheDocument();
    expect(screen.getByLabelText('4 bonnes réponses sur 5')).toHaveTextContent('4/5');
    expect(mocks.fetchQuestion).toHaveBeenCalledTimes(5);
    expect(mocks.fetchQuestion.mock.calls[0][1]).toEqual({
      level: 'CM1',
      category: 'double',
      promptType: 'double',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Rejouer cette notion' }));
    expect(await screen.findByText('Question 1 sur 5')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Arrêter la série' }));
    expect(await screen.findByRole('button', { name: /Double/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('offers a retry when a question fails to load', async () => {
    mocks.fetchQuestion.mockRejectedValueOnce(new Error('network'));
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Double/ }));
    fireEvent.click(screen.getByRole('button', { name: "C'est parti !" }));

    fireEvent.click(await screen.findByRole('button', { name: 'Réessayer' }));
    await waitFor(() => expect(screen.getByPlaceholderText('?')).toBeInTheDocument());
  });
});
