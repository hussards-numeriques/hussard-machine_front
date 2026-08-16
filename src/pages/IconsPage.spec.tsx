import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IconsPage } from './IconsPage';
import type { MyIconsResponse, IconCatalog } from '../services/icons';

const icon: IconCatalog[number] = {
  id: 'rushy-smile',
  name: 'Rushy Smile',
  rarity: 'BRONZE',
  url: 'https://example.com/rushy-smile.png',
};

const mocks = vi.hoisted(() => ({
  isAuthenticated: false,
  catalogData: undefined as IconCatalog | undefined,
  myIconsData: undefined as MyIconsResponse | undefined,
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

vi.mock('../hooks/useIcons', () => ({
  useIconCatalog: () => ({ data: mocks.catalogData, isLoading: false }),
  useMyIcons: () => ({ data: mocks.myIconsData, isLoading: false }),
  useSelectIcon: () => ({ mutate: mocks.mutate, isPending: false }),
}));

describe('IconsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAuthenticated = false;
    mocks.catalogData = [icon];
    mocks.myIconsData = {
      selected_icon_id: null,
      icons: [],
    };
  });

  it('prompts to log in when not authenticated', () => {
    render(
      <MemoryRouter>
        <IconsPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Connecte-toi pour voir tes icônes/)).toBeInTheDocument();
  });

  it('does not show equip button for locked icons', () => {
    mocks.isAuthenticated = true;
    render(
      <MemoryRouter>
        <IconsPage />
      </MemoryRouter>
    );
    expect(screen.queryByText('Équiper')).not.toBeInTheDocument();
    expect(screen.queryByText('✓ Équipé')).not.toBeInTheDocument();
  });

  it('shows equip button for unlocked but not equipped icons', () => {
    mocks.isAuthenticated = true;
    mocks.myIconsData = {
      selected_icon_id: null,
      icons: [
        {
          id: icon.id,
          name: icon.name,
          rarity: icon.rarity,
          url: icon.url,
          unlocked_at: '2026-08-15T12:00:00',
        },
      ],
    };

    render(
      <MemoryRouter>
        <IconsPage />
      </MemoryRouter>
    );

    const button = screen.getByText('Équiper');
    fireEvent.click(button);
    expect(mocks.mutate).toHaveBeenCalledWith('rushy-smile');
  });

  it('shows equipped button for selected icon and calls mutate with null on click', () => {
    mocks.isAuthenticated = true;
    mocks.myIconsData = {
      selected_icon_id: 'rushy-smile',
      icons: [
        {
          id: icon.id,
          name: icon.name,
          rarity: icon.rarity,
          url: icon.url,
          unlocked_at: '2026-08-15T12:00:00',
        },
      ],
    };

    render(
      <MemoryRouter>
        <IconsPage />
      </MemoryRouter>
    );

    const button = screen.getByText('✓ Équipé');
    fireEvent.click(button);
    expect(mocks.mutate).toHaveBeenCalledWith(null);
  });
});
