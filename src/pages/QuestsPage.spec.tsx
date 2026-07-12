import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuestsPage } from './QuestsPage';
import type { MyTitlesResponse, QuestCatalog } from '../services/quests';

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
  mutate: vi.fn(),
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
  useMyTitles: () => ({ data: mocks.myTitles, isLoading: false }),
  useSelectTitle: () => ({ mutate: mocks.mutate, isPending: false }),
}));

describe('QuestsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAuthenticated = false;
    mocks.catalog = [quest];
    mocks.myTitles = {
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
    expect(screen.getByText('Petit Conquérant (5)')).toBeInTheDocument();
  });

  it('equips a title when Équiper is clicked', () => {
    mocks.isAuthenticated = true;
    mocks.myTitles = {
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
    expect(mocks.mutate).toHaveBeenCalledWith('win-streak-bronze');
  });
});
