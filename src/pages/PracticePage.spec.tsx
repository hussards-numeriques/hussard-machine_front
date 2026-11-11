import { fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PracticePage } from './PracticePage';
import { ANSWER_INPUT_MODE_STORAGE_KEY } from '../hooks/useAnswerInputMode';
import { renderWithQueryClient } from '../test-utils';
import { ApiError } from '../services/http';
import type { PracticeCatalog, PracticeQuestion } from '../services/practice';

const mocks = vi.hoisted(() => ({
  active: true,
  fetchCatalog: vi.fn(),
  fetchQuestion: vi.fn(),
  fetchTimesTables: vi.fn(),
}));

vi.mock('canvas-confetti', () => ({ default: Object.assign(vi.fn(), { reset: vi.fn() }) }));

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
  fetchPracticeTimesTables: mocks.fetchTimesTables,
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

const timesTablesMode = async () =>
  fireEvent.click(await screen.findByRole('button', { name: 'Tables de multiplication' }));

const table = (value: number) => screen.getByRole('button', { name: `Table de ${value}` });

const answer = async (value: number) => {
  fireEvent.change(await screen.findByPlaceholderText('?'), { target: { value: String(value) } });
  fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
};

const clickWhenEnabled = async (name: string) => {
  await waitFor(() => expect(screen.getByRole('button', { name })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name }));
};

const playTimesTablesSeries = async () => {
  for (let index = 1; index <= 5; index++) {
    await answer(index * 2);
    fireEvent.click(
      screen.getByRole('button', {
        name: index === 5 ? 'Voir mon résultat' : 'Question suivante',
      })
    );
  }
};

describe('PracticePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.active = true;
    mocks.fetchCatalog.mockResolvedValue(catalog);
    mocks.fetchTimesTables.mockResolvedValue([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
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
      kind: 'notion',
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

  it('starts a notion series with no clock by default', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Double/ }));
    fireEvent.click(screen.getByRole('button', { name: "C'est parti !" }));

    expect(await screen.findByText('Question 1 sur 10')).toBeInTheDocument();
    expect(mocks.fetchQuestion.mock.calls[0][1]).toEqual({
      kind: 'notion',
      level: 'CM1',
      category: 'double',
      promptType: 'double',
    });
    expect(screen.queryByText(/^\d+s$/)).not.toBeInTheDocument();
  });

  it('requires at least one table', async () => {
    renderPage();

    await timesTablesMode();
    const start = screen.getByRole('button', { name: "C'est parti !" });
    expect(start).toBeDisabled();
    expect(screen.getByText('Choisis au moins une table.')).toBeInTheDocument();

    fireEvent.click(table(6));
    expect(start).toBeEnabled();
    fireEvent.click(table(6));
    expect(start).toBeDisabled();
  });

  it('plays combined times tables and replays them', async () => {
    renderPage();

    await timesTablesMode();
    fireEvent.click(table(7));
    fireEvent.click(table(6));
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    fireEvent.click(screen.getByRole('button', { name: "C'est parti !" }));

    expect(await screen.findByText('Question 1 sur 5')).toBeInTheDocument();
    expect(screen.getByText('Tables de 6 et 7')).toBeInTheDocument();
    expect(mocks.fetchQuestion.mock.calls[0][1]).toEqual({ kind: 'timesTables', tables: [6, 7] });

    for (let index = 1; index <= 5; index++) {
      await answer(index * 2);
      fireEvent.click(
        screen.getByRole('button', {
          name: index === 5 ? 'Voir mon résultat' : 'Question suivante',
        })
      );
    }

    expect(screen.getByText('Tables de 6 et 7')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Changer de tables' })).toBeInTheDocument();
    mocks.fetchQuestion.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Rejouer ces tables' }));
    expect(await screen.findByText('Question 1 sur 5')).toBeInTheDocument();
    expect(mocks.fetchQuestion.mock.calls[0][1]).toEqual({ kind: 'timesTables', tables: [6, 7] });
  });

  it('keeps choices when switching mode', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Double/ }));
    await timesTablesMode();
    fireEvent.click(table(6));
    fireEvent.click(screen.getByRole('button', { name: 'Par notion' }));
    expect(screen.getByRole('button', { name: /Double/ })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Tables de multiplication' }));
    expect(table(6)).toHaveAttribute('aria-pressed', 'true');
  });

  it.each([
    ['1', '2'],
    ['100', '99'],
    ['', '10'],
  ])('clamps the typed time limit %j to %s', async (typed, expected) => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Limité' }));
    const field = screen.getByLabelText('Secondes par question');
    fireEvent.change(field, { target: { value: typed } });
    fireEvent.blur(field);

    expect(field).toHaveValue(Number(expected));
  });

  it('uses a typed time limit without waiting for blur', async () => {
    renderPage();

    await timesTablesMode();
    fireEvent.click(table(6));
    fireEvent.click(screen.getByRole('button', { name: 'Limité' }));
    fireEvent.change(screen.getByLabelText('Secondes par question'), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: "C'est parti !" }));

    expect(await screen.findByText('Question 1 sur 10')).toBeInTheDocument();
    expect(await screen.findByText(/^1[45]s$/)).toBeInTheDocument();
  });

  it('keeps a partial entry unclamped while typing', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Limité' }));
    const field = screen.getByLabelText('Secondes par question');
    fireEvent.change(field, { target: { value: '1' } });
    expect(field).toHaveValue(1);
    fireEvent.change(field, { target: { value: '12' } });
    fireEvent.blur(field);
    expect(field).toHaveValue(12);
  });

  it('commits the typed time limit on Enter', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Limité' }));
    const field = screen.getByLabelText('Secondes par question');
    fireEvent.change(field, { target: { value: '1' } });
    fireEvent.keyDown(field, { key: 'Enter' });

    expect(field).toHaveValue(2);
  });

  it('keeps the time limit and tables through replay and the return to setup', async () => {
    renderPage();

    await timesTablesMode();
    fireEvent.click(table(7));
    fireEvent.click(table(6));
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    fireEvent.click(screen.getByRole('button', { name: 'Limité' }));
    const field = screen.getByLabelText('Secondes par question');
    fireEvent.change(field, { target: { value: '15' } });
    fireEvent.blur(field);
    fireEvent.click(screen.getByRole('button', { name: "C'est parti !" }));

    expect(await screen.findByText('Question 1 sur 5')).toBeInTheDocument();
    await playTimesTablesSeries();

    fireEvent.click(screen.getByRole('button', { name: 'Rejouer ces tables' }));
    expect(await screen.findByText('Question 1 sur 5')).toBeInTheDocument();
    expect(await screen.findByText(/^1[45]s$/)).toBeInTheDocument();
    await playTimesTablesSeries();

    fireEvent.click(screen.getByRole('button', { name: 'Changer de tables' }));
    expect(await screen.findByRole('button', { name: 'Limité' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByLabelText('Secondes par question')).toHaveValue(15);
    expect(table(6)).toHaveAttribute('aria-pressed', 'true');
    expect(table(7)).toHaveAttribute('aria-pressed', 'true');
    expect(table(8)).toHaveAttribute('aria-pressed', 'false');
  });

  it('counts a timeout as a mistake', { timeout: 15000 }, async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Double/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Limité' }));
    const field = screen.getByLabelText('Secondes par question');
    fireEvent.change(field, { target: { value: '2' } });
    fireEvent.blur(field);
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    fireEvent.click(screen.getByRole('button', { name: "C'est parti !" }));

    expect(await screen.findByText('Temps écoulé !', {}, { timeout: 3500 })).toBeInTheDocument();
    await clickWhenEnabled('Question suivante');
    for (const value of [4, 6, 8]) {
      await answer(value);
      fireEvent.click(screen.getByRole('button', { name: 'Question suivante' }));
    }
    await answer(10);
    fireEvent.click(screen.getByRole('button', { name: 'Voir mon résultat' }));

    expect(await screen.findByLabelText('4 bonnes réponses sur 5')).toBeInTheDocument();
  });

  it('times out on the last question', { timeout: 15000 }, async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Double/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Limité' }));
    const field = screen.getByLabelText('Secondes par question');
    fireEvent.change(field, { target: { value: '2' } });
    fireEvent.blur(field);
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    fireEvent.click(screen.getByRole('button', { name: "C'est parti !" }));

    for (const value of [2, 4, 6, 8]) {
      await answer(value);
      fireEvent.click(screen.getByRole('button', { name: 'Question suivante' }));
    }
    expect(await screen.findByText('Temps écoulé !', {}, { timeout: 3500 })).toBeInTheDocument();
    await clickWhenEnabled('Voir mon résultat');

    expect(screen.getByLabelText('4 bonnes réponses sur 5')).toBeInTheDocument();
  });

  it('keeps the notion flow usable when times tables fail and lets the tables retry', async () => {
    mocks.fetchTimesTables.mockRejectedValueOnce(new Error('network'));
    renderPage();

    expect(await screen.findByLabelText('Niveau')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tables de multiplication' }));
    expect(
      await screen.findByText("Impossible de charger l'entraînement pour le moment.")
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "C'est parti !" })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(await screen.findByRole('button', { name: 'Table de 6' })).toBeInTheDocument();
    expect(mocks.fetchTimesTables).toHaveBeenCalledTimes(2);
  });

  it('remembers the chosen limit when it is turned off and back on', async () => {
    renderPage();
    await screen.findByLabelText('Niveau');
    fireEvent.click(screen.getByRole('button', { name: 'Limité' }));
    fireEvent.change(screen.getByLabelText('Secondes par question'), { target: { value: '5' } });
    fireEvent.blur(screen.getByLabelText('Secondes par question'));

    fireEvent.click(screen.getByRole('button', { name: 'Sans limite' }));
    expect(screen.queryByLabelText('Secondes par question')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Limité' }));

    expect(screen.getByLabelText('Secondes par question')).toHaveValue(5);
  });

  it.each([
    ['handwriting', '4', true],
    ['handwriting', '5', false],
    ['keypad', '2', false],
  ])('with %s input and a limit of %s, the hint shows: %s', async (inputMode, seconds, shown) => {
    localStorage.setItem(ANSWER_INPUT_MODE_STORAGE_KEY, inputMode);
    renderPage();
    await screen.findByLabelText('Niveau');
    fireEvent.click(screen.getByRole('button', { name: 'Limité' }));
    fireEvent.change(screen.getByLabelText('Secondes par question'), {
      target: { value: seconds },
    });
    fireEvent.blur(screen.getByLabelText('Secondes par question'));

    expect(screen.queryAllByText(/En écriture manuscrite/)).toHaveLength(shown ? 1 : 0);
  });

  it('redirects when times tables report an expired subscription', async () => {
    mocks.fetchTimesTables.mockRejectedValue(new ApiError(403, 'expired', 'SUBSCRIPTION_REQUIRED'));
    renderPage();
    expect(await screen.findByText('Subscription page')).toBeInTheDocument();
  });

  describe('icon unlock toast', () => {
    const unlockedIcon = {
      id: 'practice-bronze',
      rarity: 'BRONZE',
      url: 'http://localhost:8000/static/icons/practice-bronze.svg',
    };

    const startDoubleSeries = async () => {
      renderPage();
      fireEvent.click(await screen.findByRole('button', { name: /Double/ }));
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: "C'est parti !" }));
      expect(await screen.findByText('Question 1 sur 5')).toBeInTheDocument();
    };

    it('shows the toast when a question carries an unlocked icon and keeps it on the next question', async () => {
      let value = 0;
      mocks.fetchQuestion.mockImplementation(async () => {
        value += 1;
        return value === 1 ? { ...doubleOf(value), unlockedIcon } : doubleOf(value);
      });
      await startDoubleSeries();

      expect(await screen.findByText('Icône Commun débloquée !')).toBeInTheDocument();
      expect(screen.getByText('Apprenti assidu')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Équiper cette icône' })).toHaveAttribute(
        'href',
        '/icons'
      );

      await answer(2);
      fireEvent.click(screen.getByRole('button', { name: 'Question suivante' }));
      expect(await screen.findByText('Question 2 sur 5')).toBeInTheDocument();
      expect(screen.getAllByText('Icône Commun débloquée !')).toHaveLength(1);
    });

    it('shows no toast when no question carries an unlocked icon', async () => {
      await startDoubleSeries();
      expect(screen.queryByText(/débloquée/)).not.toBeInTheDocument();
    });
  });
});
