import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuestsPage } from './QuestsPage';
import type { MyTitlesResponse, QuestCatalog } from '../services/quests';
import type { SubscriptionStatus } from '../services/subscription';

const quest: QuestCatalog[number] = {
  id: 'win-streak',
  label: "Terminer 1er en parties d'affilée",
  tiers: [
    {
      threshold: 5,
      title: { id: 'win-streak-bronze', label: 'Petit Conquérant', rarity: 'BRONZE' },
    },
  ],
};

const mocks = vi.hoisted(() => ({
  isAuthenticated: false,
  catalog: undefined as QuestCatalog | undefined,
  myTitles: undefined as MyTitlesResponse | undefined,
  subscriptionStatus: undefined as SubscriptionStatus | undefined,
  mutate: vi.fn(),
  requestedLevels: [] as (string | null)[],
  isPlaceholderData: false,
  failLevel: null as string | null,
}));

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    client: {},
    user: null,
    isAuthenticated: mocks.isAuthenticated,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    reloadUser: vi.fn(),
  }),
}));

vi.mock('../hooks/useQuests', () => ({
  useQuestCatalog: () => ({ data: mocks.catalog, isLoading: false }),
  useMyTitles: (level: string | null) => {
    mocks.requestedLevels.push(level);
    const data = mocks.failLevel !== null && level === mocks.failLevel ? undefined : mocks.myTitles;
    return { data, isLoading: false, isPlaceholderData: mocks.isPlaceholderData };
  },
  useSelectTitle: () => ({ mutate: mocks.mutate, isPending: false }),
}));

vi.mock('../hooks/useSubscription', () => ({
  useSubscriptionStatus: () => ({ data: mocks.subscriptionStatus }),
}));

describe('QuestsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAuthenticated = false;
    mocks.catalog = [quest];
    mocks.subscriptionStatus = { active: true, expires_at: '2026-08-21T12:00:00' };
    mocks.requestedLevels = [];
    mocks.isPlaceholderData = false;
    mocks.failLevel = null;
    mocks.myTitles = {
      level: 'CP',
      current_level: 'CP',
      selected_title_id: null,
      titles: [],
      quests: [
        {
          id: 'win-streak',
          label: quest.label,
          progress: 2,
          tiers: [{ threshold: 5, title_id: 'win-streak-bronze', unlocked: false }],
        },
      ],
    };
  });

  it('prompts to log in when not authenticated', () => {
    render(
      <MemoryRouter>
        <QuestsPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Connecte-toi pour voir tes quêtes/)).toBeInTheDocument();
  });

  it('lists quests with their progress', () => {
    mocks.isAuthenticated = true;
    render(
      <MemoryRouter>
        <QuestsPage />
      </MemoryRouter>
    );
    expect(screen.getByText(quest.label)).toBeInTheDocument();
    expect(screen.getByText('Petit Conquérant')).toBeInTheDocument();
  });

  it('shows the active banner and requests the current level by default', () => {
    mocks.isAuthenticated = true;
    mocks.myTitles = {
      level: 'CP',
      current_level: 'CP',
      selected_title_id: null,
      titles: [],
      quests: [
        {
          id: 'win-streak',
          label: quest.label,
          progress: 5,
          tiers: [{ threshold: 5, title_id: 'win-streak-bronze', unlocked: true }],
        },
      ],
    };

    render(
      <MemoryRouter>
        <QuestsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Titres actifs — niveau CP.')).toBeInTheDocument();
    expect(mocks.requestedLevels[0]).toBeNull();
    expect(screen.getByText('Équiper')).toBeInTheDocument();
  });

  it('lets the player pick another level and reset to the current one', () => {
    mocks.isAuthenticated = true;
    render(
      <MemoryRouter>
        <QuestsPage />
      </MemoryRouter>
    );

    const select = screen.getByLabelText('Niveau affiché') as HTMLSelectElement;
    expect(select.value).toBe('CP');
    expect(screen.getByText('CP (actuel)')).toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'CE2' } });
    expect(mocks.requestedLevels.at(-1)).toBe('CE2');

    fireEvent.change(select, { target: { value: 'CP' } });
    expect(mocks.requestedLevels.at(-1)).toBeNull();
  });

  it('equips a title when Équiper is clicked, sending the viewed level', () => {
    mocks.isAuthenticated = true;
    mocks.myTitles = {
      level: 'CP',
      current_level: 'CP',
      selected_title_id: null,
      titles: [],
      quests: [
        {
          id: 'win-streak',
          label: quest.label,
          progress: 5,
          tiers: [{ threshold: 5, title_id: 'win-streak-bronze', unlocked: true }],
        },
      ],
    };

    render(
      <MemoryRouter>
        <QuestsPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Équiper'));
    expect(mocks.mutate).toHaveBeenCalledWith({ titleId: 'win-streak-bronze', level: 'CP' });
  });

  it('shows the inactive banner without an equip button when viewing another level', () => {
    mocks.isAuthenticated = true;
    mocks.myTitles = {
      level: 'CP',
      current_level: 'CM1',
      selected_title_id: 'win-streak-bronze',
      titles: [
        {
          id: 'win-streak-bronze',
          label: 'Petit Conquérant',
          rarity: 'BRONZE',
          unlocked_at: '2026-01-01T00:00:00',
        },
      ],
      quests: [
        {
          id: 'win-streak',
          label: quest.label,
          progress: 5,
          tiers: [{ threshold: 5, title_id: 'win-streak-bronze', unlocked: true }],
        },
      ],
    };

    render(
      <MemoryRouter>
        <QuestsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Niveau CP — titres inactifs.')).toBeInTheDocument();
    expect(screen.queryByText('Équiper')).not.toBeInTheDocument();
    expect(screen.getByText('✓ Était équipé')).toBeInTheDocument();
  });

  it('shows the empty-titles message for an inactive level with nothing unlocked', () => {
    mocks.isAuthenticated = true;
    mocks.myTitles = {
      level: 'CP',
      current_level: 'CM1',
      selected_title_id: null,
      titles: [],
      quests: [
        {
          id: 'win-streak',
          label: quest.label,
          progress: 0,
          tiers: [{ threshold: 5, title_id: 'win-streak-bronze', unlocked: false }],
        },
      ],
    };

    render(
      <MemoryRouter>
        <QuestsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Aucun titre débloqué à ce niveau.')).toBeInTheDocument();
  });

  it('keeps the active empty-titles message on the active view', () => {
    mocks.isAuthenticated = true;
    render(
      <MemoryRouter>
        <QuestsPage />
      </MemoryRouter>
    );

    expect(
      screen.getByText(
        "Aucun titre débloqué pour l'instant. Progresse dans les quêtes ci-dessous pour en gagner !"
      )
    ).toBeInTheDocument();
  });

  it('shows a pause banner and a link to the subscription page when inactive', () => {
    mocks.isAuthenticated = true;
    mocks.subscriptionStatus = { active: false, expires_at: null };
    render(
      <MemoryRouter>
        <QuestsPage />
      </MemoryRouter>
    );

    expect(
      screen.getByText(
        'Ta progression vers les prochains titres est en pause. Les titres déjà débloqués restent à toi.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Voir l'abonnement" })).toHaveAttribute(
      'href',
      '/subscription'
    );
  });

  it('does not show the pause banner when active', () => {
    mocks.isAuthenticated = true;
    mocks.subscriptionStatus = { active: true, expires_at: '2026-08-21T12:00:00' };
    render(
      <MemoryRouter>
        <QuestsPage />
      </MemoryRouter>
    );

    expect(
      screen.queryByText(/Ta progression vers les prochains titres est en pause/)
    ).not.toBeInTheDocument();
  });

  it('does not show the pause banner on an inactive level view', () => {
    mocks.isAuthenticated = true;
    mocks.subscriptionStatus = { active: false, expires_at: null };
    mocks.myTitles = {
      level: 'CP',
      current_level: 'CM1',
      selected_title_id: 'win-streak-bronze',
      titles: [
        {
          id: 'win-streak-bronze',
          label: 'Petit Conquérant',
          rarity: 'BRONZE',
          unlocked_at: '2026-01-01T00:00:00',
        },
      ],
      quests: [
        {
          id: 'win-streak',
          label: quest.label,
          progress: 5,
          tiers: [{ threshold: 5, title_id: 'win-streak-bronze', unlocked: true }],
        },
      ],
    };

    render(
      <MemoryRouter>
        <QuestsPage />
      </MemoryRouter>
    );

    expect(
      screen.queryByText(/progression vers les prochains titres est en pause/)
    ).not.toBeInTheDocument();
  });

  it('keeps the selector on the newly picked level while its data is still placeholder data', () => {
    mocks.isAuthenticated = true;
    mocks.isPlaceholderData = true;

    render(
      <MemoryRouter>
        <QuestsPage />
      </MemoryRouter>
    );

    const select = screen.getByLabelText('Niveau affiché') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'CE2' } });

    expect(select.value).toBe('CE2');
  });

  it('lets the player return to their level when another level fails to load', () => {
    mocks.isAuthenticated = true;
    mocks.failLevel = 'CE2';

    render(
      <MemoryRouter>
        <QuestsPage />
      </MemoryRouter>
    );

    const select = screen.getByLabelText('Niveau affiché') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'CE2' } });

    expect(
      screen.getByText('Impossible de charger les titres de ce niveau pour le moment.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('Revenir à mon niveau'));

    expect(mocks.requestedLevels.at(-1)).toBeNull();
    expect(screen.getByText('Titres actifs — niveau CP.')).toBeInTheDocument();
  });
});
