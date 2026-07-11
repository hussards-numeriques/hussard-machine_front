# Quêtes & Titres Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let players equip a cosmetic title unlocked through quests, show it in the lobby/podium next to other players, and add a `/quests` page to track quest progress, equip/unequip titles, and see an unlock toast at the podium.

**Architecture:** Three new backend REST routes (`GET /quests`, `GET /me/titles`, `PUT /me/selected-title`) wrapped in a port/adapter service (`services/quests/`, mirrors `services/streak/`), consumed via TanStack Query hooks (no dedicated Context — titles are only needed on `/quests` and in the podium unlock-detection hook). A new WS field `player.title` is added to the existing `playerSchema`. Detection of newly-unlocked titles is done client-side by diffing `GET /me/titles` between lobby entry and podium (no WS event for unlocks).

**Tech Stack:** React 19, TypeScript (strict), TanStack Query, zod, Tailwind, Vitest + Testing Library.

## Global Constraints

- No comments in code except linter directives (see `doc/conventions.md`).
- Strict TypeScript, no `any`.
- Every payload entering the app (HTTP responses, WS messages) is validated with zod in the service layer.
- Components never call `fetch` directly; every endpoint lives in a `services/` module.
- `rarity` is an open list (`BRONZE | SILVER | GOLD | DIAMOND` known today) — always resolve display via a lookup with a fallback, never hardcode an exhaustive switch that would drop an unknown value.
- All checks must pass before considering a task done: `npm run lint && npx prettier --check . && npx tsc -b && npm run test` (or `./scripts/validate.sh`).
- Full design reference: `docs/superpowers/specs/2026-07-12-quests-and-titles-design.md`. Backend contract: `CONTRAT-FRONT-quetes-titres.md` (repo root, untracked).

---

### Task 1: `Player.title` type + WS schema validation

**Files:**

- Modify: `src/types.ts`
- Modify: `src/services/gameSchemas.ts`
- Modify: `src/services/gameSchemas.spec.ts`
- Modify (fixtures, no behavior change): `src/App.podium.spec.tsx`, `src/GameView.auto-advance.spec.tsx`, `src/GameView.connection-status.spec.tsx`, `src/GameView.feedback.spec.tsx`, `src/views/LobbyView.spec.tsx`

**Interfaces:**

- Produces: `PlayerTitle { id: string; label: string; rarity: string }` (exported from `src/types.ts`), `Player.title: PlayerTitle | null`, zod `titleSchema` (exported from `src/services/gameSchemas.ts`).

- [ ] **Step 1: Write the failing tests**

Add to `src/services/gameSchemas.spec.ts`, after the existing two `it` blocks (inside the same `describe('serverMessageSchema', ...)`):

```ts
  it('parses a player title snapshot', () => {
    const message = serverMessageSchema.parse({
      type: 'GAME_UPDATE',
      payload: {
        ...backendGamePayload,
        players: [
          {
            ...backendGamePayload.players[0],
            title: { id: 'win-streak-bronze', label: 'Petit Conquérant', rarity: 'BRONZE' },
          },
        ],
      },
    });

    if (message.type !== 'GAME_UPDATE') throw new Error('unexpected message type');
    expect(message.payload.players[0].title).toEqual({
      id: 'win-streak-bronze',
      label: 'Petit Conquérant',
      rarity: 'BRONZE',
    });
  });

  it('parses a player with no equipped title as null', () => {
    const message = serverMessageSchema.parse({
      type: 'GAME_UPDATE',
      payload: {
        ...backendGamePayload,
        players: [{ ...backendGamePayload.players[0], title: null }],
      },
    });

    if (message.type !== 'GAME_UPDATE') throw new Error('unexpected message type');
    expect(message.payload.players[0].title).toBeNull();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/services/gameSchemas.spec.ts`
Expected: the two new tests FAIL — `title` is `undefined` (stripped by zod) instead of the expected object / `null`.

- [ ] **Step 3: Add `PlayerTitle` to the shared types**

In `src/types.ts`, add the interface right before `export interface Player {` and add the `title` field inside `Player` (after `daily_streak`, before `bot_config`):

```ts
export interface PlayerTitle {
  id: string;
  label: string;
  rarity: string;
}

export interface Player {
  id: string;
  name: string;
  is_bot: boolean;
  is_ready: boolean;
  is_connected: boolean;
  score: number;
  level: string;
  grade: string;
  daily_streak: number;
  title: PlayerTitle | null;
  bot_config: BotConfig | null;
}
```

- [ ] **Step 4: Validate the field in `gameSchemas.ts`**

In `src/services/gameSchemas.ts`, add imports and a schema, then wire it into `playerSchema`:

```ts
import type { Answer, BotConfig, Game, Player, PlayerTitle, Question } from '../types';
```

```ts
const titleSchema = z.object({
  id: z.string(),
  label: z.string(),
  rarity: z.string(),
}) satisfies z.ZodType<PlayerTitle>;

const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_bot: z.boolean(),
  is_ready: z.boolean(),
  is_connected: z.boolean(),
  score: z.number(),
  level: z.string(),
  grade: z.string(),
  daily_streak: z.number(),
  title: titleSchema.nullable(),
  bot_config: botConfigSchema.nullable(),
}) satisfies z.ZodType<Player>;
```

(`titleSchema` is declared once, above `playerSchema`; export it — later tasks don't need it, but it keeps the pattern used by `botConfigSchema`/`questionSchema` etc. No need to add it to any export list beyond what's already exported from the file.)

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/services/gameSchemas.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Fix the now-broken `Player` type errors in existing test fixtures**

`Player.title` is required, so every literal typed as `Game`/`Player` in the test suite needs a `title: null,` line. Run:

```bash
for f in src/App.podium.spec.tsx src/GameView.auto-advance.spec.tsx src/GameView.connection-status.spec.tsx src/GameView.feedback.spec.tsx src/views/LobbyView.spec.tsx; do
  sed -i 's/^\([[:space:]]*\)bot_config: null,$/\1bot_config: null,\n\1title: null,/' "$f"
done
```

- [ ] **Step 7: Verify the whole suite compiles and passes**

Run: `npx tsc -b && npm run test`
Expected: no type errors, all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/types.ts src/services/gameSchemas.ts src/services/gameSchemas.spec.ts src/App.podium.spec.tsx src/GameView.auto-advance.spec.tsx src/GameView.connection-status.spec.tsx src/GameView.feedback.spec.tsx src/views/LobbyView.spec.tsx
git commit -m "feat: validate the player.title WS field"
```

---

### Task 2: Rarity domain helpers — `src/lib/titles.ts`

**Files:**

- Create: `src/lib/titles.ts`
- Test: `src/lib/titles.spec.ts`

**Interfaces:**

- Produces: `RARITIES`, `Rarity`, `resolveRarityLabel(rarity: string): string`, `resolveRarityTextColor(rarity: string): string`, `resolveRarityBadgeStyle(rarity: string): string`, `DEFAULT_RARITY_TEXT_COLOR`, `DEFAULT_RARITY_BADGE_STYLE`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/titles.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RARITY_BADGE_STYLE,
  DEFAULT_RARITY_TEXT_COLOR,
  resolveRarityBadgeStyle,
  resolveRarityLabel,
  resolveRarityTextColor,
} from './titles';

describe('resolveRarityLabel', () => {
  it.each([
    ['BRONZE', 'Bronze'],
    ['SILVER', 'Argent'],
    ['GOLD', 'Or'],
    ['DIAMOND', 'Diamant'],
  ])('maps %s to %s', (rarity, expected) => {
    expect(resolveRarityLabel(rarity)).toBe(expected);
  });

  it('falls back to the raw value for an unknown rarity', () => {
    expect(resolveRarityLabel('MYTHIC')).toBe('MYTHIC');
  });
});

describe('resolveRarityTextColor', () => {
  it('maps a known rarity to a text color', () => {
    expect(resolveRarityTextColor('GOLD')).toBe('text-yellow-600');
  });

  it('falls back to the default text color for an unknown rarity', () => {
    expect(resolveRarityTextColor('MYTHIC')).toBe(DEFAULT_RARITY_TEXT_COLOR);
  });
});

describe('resolveRarityBadgeStyle', () => {
  it('maps a known rarity to a badge style', () => {
    expect(resolveRarityBadgeStyle('DIAMOND')).toBe('bg-cyan-100 text-cyan-700 border-cyan-300');
  });

  it('falls back to the default badge style for an unknown rarity', () => {
    expect(resolveRarityBadgeStyle('MYTHIC')).toBe(DEFAULT_RARITY_BADGE_STYLE);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/titles.spec.ts`
Expected: FAIL — `Cannot find module './titles'`.

- [ ] **Step 3: Implement `src/lib/titles.ts`**

```ts
export const RARITIES = ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'] as const;
export type Rarity = (typeof RARITIES)[number];

const RARITY_LABELS: Record<Rarity, string> = {
  BRONZE: 'Bronze',
  SILVER: 'Argent',
  GOLD: 'Or',
  DIAMOND: 'Diamant',
};

const RARITY_TEXT_COLORS: Record<Rarity, string> = {
  BRONZE: 'text-amber-600',
  SILVER: 'text-slate-500',
  GOLD: 'text-yellow-600',
  DIAMOND: 'text-cyan-600',
};

const RARITY_BADGE_STYLES: Record<Rarity, string> = {
  BRONZE: 'bg-amber-100 text-amber-800 border-amber-300',
  SILVER: 'bg-slate-100 text-slate-600 border-slate-300',
  GOLD: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  DIAMOND: 'bg-cyan-100 text-cyan-700 border-cyan-300',
};

export const DEFAULT_RARITY_TEXT_COLOR = 'text-slate-500';
export const DEFAULT_RARITY_BADGE_STYLE = 'bg-slate-100 text-slate-600 border-slate-300';

const isRarity = (value: string): value is Rarity =>
  (RARITIES as readonly string[]).includes(value);

export const resolveRarityLabel = (rarity: string): string =>
  isRarity(rarity) ? RARITY_LABELS[rarity] : rarity;

export const resolveRarityTextColor = (rarity: string): string =>
  isRarity(rarity) ? RARITY_TEXT_COLORS[rarity] : DEFAULT_RARITY_TEXT_COLOR;

export const resolveRarityBadgeStyle = (rarity: string): string =>
  isRarity(rarity) ? RARITY_BADGE_STYLES[rarity] : DEFAULT_RARITY_BADGE_STYLE;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/titles.spec.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/titles.ts src/lib/titles.spec.ts
git commit -m "feat: add rarity domain helpers (lib/titles)"
```

---

### Task 3: Quests service — `src/services/quests/` (port/adapter)

**Files:**

- Create: `src/services/quests/port.ts`
- Create: `src/services/quests/HttpQuestsAdapter.ts`
- Create: `src/services/quests/index.ts`
- Test: `src/services/quests/HttpQuestsAdapter.spec.ts`

**Interfaces:**

- Consumes: `getApiUrl()` from `src/services/apiConfig.ts`.
- Produces: `questsRepository: QuestsRepository` (singleton, exported from `src/services/quests/index.ts`), types `QuestCatalog`, `Quest`, `QuestTier`, `QuestTitle`, `MyTitlesResponse`, `MyTitle`, `MyQuest`, `MyQuestTier`, `AuthorizedFetch`, `QuestsRepository`.

- [ ] **Step 1: Create `port.ts`**

```ts
export interface QuestTitle {
  id: string;
  label: string;
  rarity: string;
}

export interface QuestTier {
  threshold: number;
  title: QuestTitle;
}

export interface Quest {
  id: string;
  label: string;
  tiers: QuestTier[];
}

export type QuestCatalog = Quest[];

export interface MyTitle {
  id: string;
  label: string;
  rarity: string;
  unlocked_at: string;
}

export interface MyQuestTier {
  threshold: number;
  title_id: string;
  unlocked: boolean;
}

export interface MyQuest {
  id: string;
  label: string;
  progress: number;
  tiers: MyQuestTier[];
}

export interface MyTitlesResponse {
  selected_title_id: string | null;
  titles: MyTitle[];
  quests: MyQuest[];
}

export type AuthorizedFetch = (input: string, init?: RequestInit) => Promise<Response>;

export interface QuestsRepository {
  fetchCatalog(): Promise<QuestCatalog>;
  fetchMyTitles(authorizedFetch: AuthorizedFetch): Promise<MyTitlesResponse>;
  selectTitle(authorizedFetch: AuthorizedFetch, titleId: string | null): Promise<string | null>;
}
```

- [ ] **Step 2: Write the failing tests**

Create `src/services/quests/HttpQuestsAdapter.spec.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { HttpQuestsAdapter } from './HttpQuestsAdapter';
import type { AuthorizedFetch, MyTitlesResponse, QuestCatalog } from './port';

const catalogSample: QuestCatalog = [
  {
    id: 'win-streak',
    label: "Terminer 1er en parties d'affilée",
    tiers: [
      {
        threshold: 5,
        title: { id: 'win-streak-bronze', label: 'Petit Conquérant', rarity: 'BRONZE' },
      },
    ],
  },
];

const myTitlesSample: MyTitlesResponse = {
  selected_title_id: 'win-streak-bronze',
  titles: [
    {
      id: 'win-streak-bronze',
      label: 'Petit Conquérant',
      rarity: 'BRONZE',
      unlocked_at: '2026-07-10T18:42:03',
    },
  ],
  quests: [
    {
      id: 'win-streak',
      label: "Terminer 1er en parties d'affilée",
      progress: 7,
      tiers: [{ threshold: 5, title_id: 'win-streak-bronze', unlocked: true }],
    },
  ],
};

describe('HttpQuestsAdapter', () => {
  it('fetches /quests without an authorizedFetch', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(catalogSample), { status: 200 }));
    const adapter = new HttpQuestsAdapter();

    const result = await adapter.fetchCatalog();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect((fetchSpy.mock.calls[0][0] as string).endsWith('/quests')).toBe(true);
    expect(result).toEqual(catalogSample);
    fetchSpy.mockRestore();
  });

  it('throws when /quests responds with an error status', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('nope', { status: 500 }));
    const adapter = new HttpQuestsAdapter();

    await expect(adapter.fetchCatalog()).rejects.toThrow();
    fetchSpy.mockRestore();
  });

  it('fetches /me/titles via the provided authorizedFetch', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(
      async () => new Response(JSON.stringify(myTitlesSample), { status: 200 })
    );
    const adapter = new HttpQuestsAdapter();

    const result = await adapter.fetchMyTitles(authorizedFetch);

    expect(authorizedFetch).toHaveBeenCalledTimes(1);
    expect((authorizedFetch.mock.calls[0][0] as string).endsWith('/me/titles')).toBe(true);
    expect(result).toEqual(myTitlesSample);
  });

  it('throws when /me/titles responds with an error status', async () => {
    const authorizedFetch = vi.fn(async () => new Response('nope', { status: 401 }));
    const adapter = new HttpQuestsAdapter();

    await expect(adapter.fetchMyTitles(authorizedFetch)).rejects.toThrow();
  });

  it('PUTs the title id and returns the selected title id', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(
      async () =>
        new Response(JSON.stringify({ selected_title_id: 'win-streak-bronze' }), { status: 200 })
    );
    const adapter = new HttpQuestsAdapter();

    const result = await adapter.selectTitle(authorizedFetch, 'win-streak-bronze');

    expect(authorizedFetch).toHaveBeenCalledTimes(1);
    const [url, init] = authorizedFetch.mock.calls[0];
    expect((url as string).endsWith('/me/selected-title')).toBe(true);
    expect(init?.method).toBe('PUT');
    expect(init?.body).toBe(JSON.stringify({ title_id: 'win-streak-bronze' }));
    expect(result).toBe('win-streak-bronze');
  });

  it('unequips by sending a null title id', async () => {
    const authorizedFetch = vi.fn<AuthorizedFetch>(
      async () => new Response(JSON.stringify({ selected_title_id: null }), { status: 200 })
    );
    const adapter = new HttpQuestsAdapter();

    const result = await adapter.selectTitle(authorizedFetch, null);

    const [, init] = authorizedFetch.mock.calls[0];
    expect(init?.body).toBe(JSON.stringify({ title_id: null }));
    expect(result).toBeNull();
  });

  it('throws when the selection request responds with an error status', async () => {
    const authorizedFetch = vi.fn(async () => new Response('nope', { status: 400 }));
    const adapter = new HttpQuestsAdapter();

    await expect(adapter.selectTitle(authorizedFetch, 'win-streak-bronze')).rejects.toThrow();
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run src/services/quests/HttpQuestsAdapter.spec.ts`
Expected: FAIL — `Cannot find module './HttpQuestsAdapter'`.

- [ ] **Step 4: Implement `HttpQuestsAdapter.ts`**

```ts
import { z } from 'zod';
import type {
  AuthorizedFetch,
  MyTitlesResponse,
  QuestCatalog,
  QuestsRepository,
} from './port';
import { getApiUrl } from '../apiConfig';

const questTitleSchema = z.object({
  id: z.string(),
  label: z.string(),
  rarity: z.string(),
});

const questCatalogSchema = z.array(
  z.object({
    id: z.string(),
    label: z.string(),
    tiers: z.array(
      z.object({
        threshold: z.number(),
        title: questTitleSchema,
      })
    ),
  })
) satisfies z.ZodType<QuestCatalog>;

const myTitlesResponseSchema = z.object({
  selected_title_id: z.string().nullable(),
  titles: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      rarity: z.string(),
      unlocked_at: z.string(),
    })
  ),
  quests: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      progress: z.number(),
      tiers: z.array(
        z.object({
          threshold: z.number(),
          title_id: z.string(),
          unlocked: z.boolean(),
        })
      ),
    })
  ),
}) satisfies z.ZodType<MyTitlesResponse>;

const selectedTitleResponseSchema = z.object({ selected_title_id: z.string().nullable() });

export class HttpQuestsAdapter implements QuestsRepository {
  public async fetchCatalog(): Promise<QuestCatalog> {
    const response = await fetch(`${getApiUrl()}/quests`);
    if (!response.ok) {
      throw new Error(`Failed to fetch quests (${response.status})`);
    }
    return questCatalogSchema.parse(await response.json());
  }

  public async fetchMyTitles(authorizedFetch: AuthorizedFetch): Promise<MyTitlesResponse> {
    const response = await authorizedFetch(`${getApiUrl()}/me/titles`);
    if (!response.ok) {
      throw new Error(`Failed to fetch my titles (${response.status})`);
    }
    return myTitlesResponseSchema.parse(await response.json());
  }

  public async selectTitle(
    authorizedFetch: AuthorizedFetch,
    titleId: string | null
  ): Promise<string | null> {
    const response = await authorizedFetch(`${getApiUrl()}/me/selected-title`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title_id: titleId }),
    });
    if (!response.ok) {
      throw new Error(`Failed to select title (${response.status})`);
    }
    return selectedTitleResponseSchema.parse(await response.json()).selected_title_id;
  }
}
```

- [ ] **Step 5: Create `index.ts`**

```ts
import { HttpQuestsAdapter } from './HttpQuestsAdapter';
import type { QuestsRepository } from './port';

export const questsRepository: QuestsRepository = new HttpQuestsAdapter();
export type {
  AuthorizedFetch,
  MyQuest,
  MyQuestTier,
  MyTitle,
  MyTitlesResponse,
  Quest,
  QuestCatalog,
  QuestsRepository,
  QuestTier,
  QuestTitle,
} from './port';
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/services/quests/HttpQuestsAdapter.spec.ts`
Expected: PASS (7 tests).

- [ ] **Step 7: Commit**

```bash
git add src/services/quests/
git commit -m "feat: add quests service (port/adapter for /quests, /me/titles, /me/selected-title)"
```

---

### Task 4: TanStack Query hooks — `src/hooks/useQuests.ts`

**Files:**

- Create: `src/hooks/useQuests.ts`
- Test: `src/hooks/useQuests.spec.tsx`

**Interfaces:**

- Consumes: `questsRepository` from `src/services/quests` (Task 3), `useAuth()` from `src/contexts/useAuth`.
- Produces: `useQuestCatalog()`, `useMyTitles()`, `useSelectTitle()`, `MY_TITLES_QUERY_KEY` (array, used by Task 8's `useTitleUnlocks` indirectly through `useMyTitles`).

- [ ] **Step 1: Write the failing tests**

Create `src/hooks/useQuests.spec.tsx`:

```tsx
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMyTitles, useQuestCatalog, useSelectTitle } from './useQuests';

const mocks = vi.hoisted(() => ({
  isAuthenticated: false,
  fetchCatalog: vi.fn(),
  fetchMyTitles: vi.fn(),
  selectTitle: vi.fn(),
}));

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    client: { authorizedFetch: vi.fn() },
    user: null,
    isAuthenticated: mocks.isAuthenticated,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    reloadUser: vi.fn(),
  }),
}));

vi.mock('../services/quests', () => ({
  questsRepository: {
    fetchCatalog: mocks.fetchCatalog,
    fetchMyTitles: mocks.fetchMyTitles,
    selectTitle: mocks.selectTitle,
  },
}));

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useQuestCatalog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches the catalog without requiring authentication', async () => {
    mocks.fetchCatalog.mockResolvedValue([]);

    const { result } = renderHook(() => useQuestCatalog(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.fetchCatalog).toHaveBeenCalledTimes(1);
  });
});

describe('useMyTitles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAuthenticated = false;
  });

  it('does not fetch when the player is not authenticated', () => {
    const { result } = renderHook(() => useMyTitles(), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mocks.fetchMyTitles).not.toHaveBeenCalled();
  });

  it('fetches my titles when authenticated', async () => {
    mocks.isAuthenticated = true;
    mocks.fetchMyTitles.mockResolvedValue({ selected_title_id: null, titles: [], quests: [] });

    const { result } = renderHook(() => useMyTitles(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.fetchMyTitles).toHaveBeenCalledTimes(1);
  });
});

describe('useSelectTitle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isAuthenticated = true;
  });

  it('calls questsRepository.selectTitle on mutate', async () => {
    mocks.selectTitle.mockResolvedValue('win-streak-bronze');

    const { result } = renderHook(() => useSelectTitle(), { wrapper });

    act(() => {
      result.current.mutate('win-streak-bronze');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mocks.selectTitle).toHaveBeenCalledWith(expect.any(Function), 'win-streak-bronze');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/hooks/useQuests.spec.tsx`
Expected: FAIL — `Cannot find module './useQuests'`.

- [ ] **Step 3: Implement `src/hooks/useQuests.ts`**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/useAuth';
import { questsRepository } from '../services/quests';

export const QUEST_CATALOG_QUERY_KEY = ['quests-catalog'];
export const MY_TITLES_QUERY_KEY = ['my-titles'];

export const useQuestCatalog = () =>
  useQuery({
    queryKey: QUEST_CATALOG_QUERY_KEY,
    queryFn: () => questsRepository.fetchCatalog(),
    staleTime: Infinity,
  });

export const useMyTitles = () => {
  const { client, isAuthenticated, isLoading } = useAuth();

  return useQuery({
    queryKey: MY_TITLES_QUERY_KEY,
    queryFn: () =>
      questsRepository.fetchMyTitles((input, init) => client.authorizedFetch(input, init)),
    enabled: isAuthenticated && !isLoading,
  });
};

export const useSelectTitle = () => {
  const { client } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (titleId: string | null) =>
      questsRepository.selectTitle((input, init) => client.authorizedFetch(input, init), titleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_TITLES_QUERY_KEY }),
  });
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/hooks/useQuests.spec.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useQuests.ts src/hooks/useQuests.spec.tsx
git commit -m "feat: add useQuestCatalog/useMyTitles/useSelectTitle query hooks"
```

---

### Task 5: `PlayerTitle` display component

**Files:**

- Create: `src/components/PlayerTitle.tsx`
- Test: `src/components/PlayerTitle.spec.tsx`

**Interfaces:**

- Consumes: `PlayerTitle` type from `src/types.ts` (Task 1), `resolveRarityTextColor` from `src/lib/titles.ts` (Task 2), `cn` from `src/lib/utils.ts`.
- Produces: `<PlayerTitle title={PlayerTitle | null} className?={string} />` React component.

- [ ] **Step 1: Write the failing test**

Create `src/components/PlayerTitle.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlayerTitle } from './PlayerTitle';

describe('PlayerTitle', () => {
  it('renders nothing when title is null', () => {
    const { container } = render(<PlayerTitle title={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the label colored by rarity', () => {
    render(
      <PlayerTitle title={{ id: 'win-streak-gold', label: "Légende de l'Arène", rarity: 'GOLD' }} />
    );

    const el = screen.getByText(/Légende de l'Arène/);
    expect(el).toBeInTheDocument();
    expect(el.className).toContain('text-yellow-600');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/PlayerTitle.spec.tsx`
Expected: FAIL — `Cannot find module './PlayerTitle'`.

- [ ] **Step 3: Implement `src/components/PlayerTitle.tsx`**

```tsx
import React from 'react';
import { cn } from '../lib/utils';
import { resolveRarityTextColor } from '../lib/titles';
import type { PlayerTitle as PlayerTitleData } from '../types';

interface PlayerTitleProps {
  title: PlayerTitleData | null;
  className?: string;
}

export const PlayerTitle: React.FC<PlayerTitleProps> = ({ title, className }) => {
  if (!title) return null;

  return (
    <div className={cn('text-xs font-bold truncate', resolveRarityTextColor(title.rarity), className)}>
      ☆ {title.label}
    </div>
  );
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/PlayerTitle.spec.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/PlayerTitle.tsx src/components/PlayerTitle.spec.tsx
git commit -m "feat: add PlayerTitle display component"
```

---

### Task 6: Show the equipped title in `LobbyView`

**Files:**

- Modify: `src/views/LobbyView.tsx`
- Modify: `src/views/LobbyView.spec.tsx`

**Interfaces:**

- Consumes: `<PlayerTitle>` from Task 5.

- [ ] **Step 1: Write the failing test**

Add to `src/views/LobbyView.spec.tsx` (new `describe` block, at the end of the file):

```tsx
describe('LobbyView - player title', () => {
  const gameWithTitle: Game = {
    id: 'ABCD',
    state: 'WAITING',
    players: [
      {
        id: 'p1',
        name: 'Alice',
        is_bot: false,
        is_ready: false,
        is_connected: true,
        score: 0,
        level: 'CP',
        grade: 'BRONZE',
        daily_streak: 0,
        bot_config: null,
        title: { id: 'win-streak-gold', label: "Légende de l'Arène", rarity: 'GOLD' },
      },
    ],
    questions: [],
    current_question_index: -1,
    answers: [],
    start_time_current_question: null,
  };

  const mockClient = { setReady: vi.fn(), startGame: vi.fn() } as unknown as GameClient;

  it('shows the equipped title under the player name', () => {
    render(
      <LobbyView client={mockClient} game={gameWithTitle} currentPlayerId="p1" onLeave={vi.fn()} />
    );

    expect(screen.getByText(/Légende de l'Arène/)).toBeInTheDocument();
  });

  it('shows nothing extra when the player has no title', () => {
    const gameWithoutTitle: Game = {
      ...gameWithTitle,
      players: [{ ...gameWithTitle.players[0], title: null }],
    };
    render(
      <LobbyView
        client={mockClient}
        game={gameWithoutTitle}
        currentPlayerId="p1"
        onLeave={vi.fn()}
      />
    );

    expect(screen.queryByText(/☆/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/views/LobbyView.spec.tsx`
Expected: FAIL on the first new test — the title label isn't rendered anywhere yet.

- [ ] **Step 3: Wire `PlayerTitle` into the player card**

In `src/views/LobbyView.tsx`, add the import:

```tsx
import { PlayerTitle } from '../components/PlayerTitle';
```

Update the player card body (inside the `game.players.map(...)`, replacing the existing `<div className="flex-1 min-w-0">...</div>` block):

```tsx
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 truncate">{player.name}</span>
                  <PlayerStreak count={player.daily_streak} />
                </div>
                <PlayerTitle title={player.title} />
                <div className="text-xs text-slate-500">
                  {!player.is_connected ? 'Déconnecté' : player.is_bot ? 'Robot' : 'Humain'}
                </div>
              </div>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/views/LobbyView.spec.tsx`
Expected: PASS (all tests in the file, including the 2 new ones).

- [ ] **Step 5: Commit**

```bash
git add src/views/LobbyView.tsx src/views/LobbyView.spec.tsx
git commit -m "feat: show the equipped title under the player name in the lobby"
```

---

### Task 7: Show the equipped title in `PodiumView`'s full ranking

**Files:**

- Modify: `src/views/PodiumView.tsx`
- Modify: `src/App.podium.spec.tsx`

**Interfaces:**

- Consumes: `<PlayerTitle>` from Task 5.

- [ ] **Step 1: Write the failing test**

Add to `src/App.podium.spec.tsx` (new top-level `describe` block, at the end of the file):

```tsx
describe('PodiumView - player title', () => {
  it('shows the equipped title under the name in the full ranking but not in the top-3 columns', () => {
    const gameWithTitle: Game = {
      id: 'TEST2',
      state: GameState.FINISHED,
      players: [
        {
          id: 'player1',
          name: 'Player 1',
          is_bot: false,
          is_ready: true,
          is_connected: true,
          score: 150,
          level: 'CP',
          grade: 'BRONZE',
          daily_streak: 0,
          bot_config: null,
          title: { id: 'win-streak-gold', label: "Légende de l'Arène", rarity: 'GOLD' },
        },
      ],
      questions: [],
      current_question_index: 0,
      answers: [],
      start_time_current_question: null,
    };

    render(
      <MemoryRouter>
        <PodiumView game={gameWithTitle} currentPlayerId="player1" playerName="Player 1" />
      </MemoryRouter>
    );

    const rankingSection = screen.getByText('Classement complet').closest('div');
    const titleEls = screen.getAllByText(/Légende de l'Arène/);
    expect(titleEls).toHaveLength(1);
    expect(rankingSection?.contains(titleEls[0])).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/App.podium.spec.tsx`
Expected: FAIL — the title label isn't rendered anywhere.

- [ ] **Step 3: Wire `PlayerTitle` into the full ranking row**

In `src/views/PodiumView.tsx`, add the import:

```tsx
import { PlayerTitle } from '../components/PlayerTitle';
```

Replace the full-ranking row block (inside `sortedPlayers.map((p, i) => ...)`) with a version that turns the name block into a column so the title fits under the name, and add `items-center` to the outer row so the score stays vertically centered:

```tsx
        {sortedPlayers.map((p, i) => (
          <div
            key={p.id}
            className={cn(
              'flex items-center justify-between py-3 px-4 rounded-lg mb-2',
              p.id === currentPlayerId ? 'bg-primary/10 text-primary font-bold' : 'bg-slate-50'
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-mono w-6 shrink-0">{i + 1}.</span>
              <PlayerAvatar name={p.name} grade={p.grade} isBot={p.is_bot} size="sm" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold truncate">{p.name}</span>
                  <PlayerStreak count={p.daily_streak} size={16} />
                </div>
                <PlayerTitle title={p.title} />
              </div>
            </div>
            <span className="font-mono shrink-0">{p.score} pts</span>
          </div>
        ))}
```

(The top-3 podium columns above this block are untouched — they never read `p.title`, keeping the title out of the constrained columns as decided in the design.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/App.podium.spec.tsx`
Expected: PASS (all tests in the file, including the new one).

- [ ] **Step 5: Commit**

```bash
git add src/views/PodiumView.tsx src/App.podium.spec.tsx
git commit -m "feat: show the equipped title in the podium's full ranking"
```

---

### Task 8: Unlock-detection hook — `src/hooks/useTitleUnlocks.ts`

**Files:**

- Create: `src/hooks/useTitleUnlocks.ts`
- Test: `src/hooks/useTitleUnlocks.spec.ts`

**Interfaces:**

- Consumes: `useMyTitles()` from Task 4 (`src/hooks/useQuests.ts`), `MyTitle`/`MyTitlesResponse` types from Task 3, `GameState` from `src/types.ts`.
- Produces: `useTitleUnlocks(gameState: GameState | null, gameId: string | undefined): MyTitle[]`, `RETRY_DELAY_MS` (exported constant, consumed by this task's own test).

- [ ] **Step 1: Write the failing tests**

Create `src/hooks/useTitleUnlocks.spec.ts`:

```ts
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RETRY_DELAY_MS, useTitleUnlocks } from './useTitleUnlocks';
import type { MyTitle, MyTitlesResponse } from '../services/quests';

const mocks = vi.hoisted(() => ({
  data: undefined as MyTitlesResponse | undefined,
  refetch: vi.fn(),
}));

vi.mock('./useQuests', () => ({
  useMyTitles: () => ({ data: mocks.data, refetch: mocks.refetch }),
}));

const titleA: MyTitle = {
  id: 'a',
  label: 'A',
  rarity: 'BRONZE',
  unlocked_at: '2026-07-01T00:00:00',
};
const titleB: MyTitle = {
  id: 'b',
  label: 'B',
  rarity: 'SILVER',
  unlocked_at: '2026-07-12T00:00:00',
};

const response = (titles: MyTitle[]): MyTitlesResponse => ({
  selected_title_id: null,
  titles,
  quests: [],
});

describe('useTitleUnlocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.data = response([titleA]);
    mocks.refetch = vi.fn(async () => ({ data: mocks.data }) as never);
  });

  it('returns an empty array before the game finishes', () => {
    const { result } = renderHook(() => useTitleUnlocks('WAITING', 'game-1'));
    expect(result.current).toEqual([]);
  });

  it('detects a title unlocked between the lobby snapshot and the podium', async () => {
    const { rerender, result } = renderHook(
      ({ state }: { state: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' }) =>
        useTitleUnlocks(state, 'game-1'),
      { initialProps: { state: 'WAITING' as const } }
    );

    rerender({ state: 'IN_PROGRESS' });

    mocks.data = response([titleA, titleB]);
    mocks.refetch = vi.fn(async () => ({ data: mocks.data }) as never);
    rerender({ state: 'FINISHED' });

    await waitFor(() => expect(result.current).toEqual([titleB]));
  });

  it('retries once after the retry delay when nothing new is found immediately', async () => {
    vi.useFakeTimers();
    mocks.refetch = vi
      .fn()
      .mockResolvedValueOnce({ data: response([titleA]) })
      .mockResolvedValueOnce({ data: response([titleA, titleB]) });

    const { rerender, result } = renderHook(
      ({ state }: { state: 'WAITING' | 'FINISHED' }) => useTitleUnlocks(state, 'game-1'),
      { initialProps: { state: 'WAITING' as const } }
    );

    rerender({ state: 'FINISHED' });
    await vi.waitFor(() => expect(mocks.refetch).toHaveBeenCalledTimes(1));

    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);

    expect(mocks.refetch).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual([titleB]);
    vi.useRealTimers();
  });

  it('resets the snapshot and result when the game id changes', async () => {
    const { rerender, result } = renderHook(
      ({ state, gameId }: { state: 'WAITING' | 'IN_PROGRESS' | 'FINISHED'; gameId: string }) =>
        useTitleUnlocks(state, gameId),
      { initialProps: { state: 'WAITING' as const, gameId: 'game-1' } }
    );

    rerender({ state: 'FINISHED', gameId: 'game-1' });
    await waitFor(() => expect(result.current).toEqual([]));

    mocks.data = response([titleA, titleB]);
    mocks.refetch = vi.fn(async () => ({ data: mocks.data }) as never);

    rerender({ state: 'WAITING', gameId: 'game-2' });
    rerender({ state: 'FINISHED', gameId: 'game-2' });

    await waitFor(() => expect(result.current).toEqual([]));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/hooks/useTitleUnlocks.spec.ts`
Expected: FAIL — `Cannot find module './useTitleUnlocks'`.

- [ ] **Step 3: Implement `src/hooks/useTitleUnlocks.ts`**

```ts
import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../types';
import type { MyTitle } from '../services/quests';
import { useMyTitles } from './useQuests';

export const RETRY_DELAY_MS = 1500;

export function useTitleUnlocks(gameState: GameState | null, gameId: string | undefined): MyTitle[] {
  const { data, refetch } = useMyTitles();
  const snapshotRef = useRef<Set<string> | null>(null);
  const lastGameIdRef = useRef<string | undefined>(undefined);
  const [newTitles, setNewTitles] = useState<MyTitle[]>([]);

  if (gameId !== lastGameIdRef.current) {
    lastGameIdRef.current = gameId;
    snapshotRef.current = null;
    if (newTitles.length > 0) {
      setNewTitles([]);
    }
  }

  useEffect(() => {
    if ((gameState === 'WAITING' || gameState === 'COUNTDOWN') && data) {
      snapshotRef.current = new Set(data.titles.map((t) => t.id));
    }
  }, [gameState, data]);

  useEffect(() => {
    if (gameState !== 'FINISHED' || snapshotRef.current === null) {
      return;
    }
    // No snapshot means the player joined mid-game: skip detection instead of guessing.
    const knownIds = snapshotRef.current;
    let cancelled = false;

    const diffNew = (titles: MyTitle[]) => titles.filter((t) => !knownIds.has(t.id));

    const detect = async () => {
      const first = await refetch();
      const firstNew = diffNew(first.data?.titles ?? []);
      if (cancelled) return;
      if (firstNew.length > 0) {
        setNewTitles(firstNew);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      if (cancelled) return;
      const second = await refetch();
      const secondNew = diffNew(second.data?.titles ?? []);
      if (!cancelled) {
        setNewTitles(secondNew);
      }
    };

    void detect();

    return () => {
      cancelled = true;
    };
  }, [gameState, refetch]);

  return newTitles;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/hooks/useTitleUnlocks.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTitleUnlocks.ts src/hooks/useTitleUnlocks.spec.ts
git commit -m "feat: add useTitleUnlocks (lobby-to-podium title unlock diffing)"
```

---

### Task 9: Unlock toast — `src/components/quests/TitleUnlockToast.tsx`

**Files:**

- Create: `src/components/quests/TitleUnlockToast.tsx`
- Test: `src/components/quests/TitleUnlockToast.spec.tsx`

**Interfaces:**

- Consumes: `MyTitle` type from Task 3, `resolveRarityBadgeStyle`/`resolveRarityLabel` from Task 2.
- Produces: `<TitleUnlockToast titles={MyTitle[]} />` React component.

- [ ] **Step 1: Write the failing tests**

Create `src/components/quests/TitleUnlockToast.spec.tsx`:

```tsx
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TitleUnlockToast } from './TitleUnlockToast';
import type { MyTitle } from '../../services/quests';

const title: MyTitle = {
  id: 'win-streak-gold',
  label: "Légende de l'Arène",
  rarity: 'GOLD',
  unlocked_at: '2026-07-12T00:00:00',
};

describe('TitleUnlockToast', () => {
  it('renders nothing when there are no new titles', () => {
    const { container } = render(<TitleUnlockToast titles={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a toast for a newly unlocked title', () => {
    render(<TitleUnlockToast titles={[title]} />);
    expect(
      screen.getByText(/Titre débloqué : Légende de l'Arène \(Or\)/)
    ).toBeInTheDocument();
  });

  it('auto-dismisses the toast after the timeout', () => {
    vi.useFakeTimers();
    render(<TitleUnlockToast titles={[title]} />);
    expect(screen.getByText(/Titre débloqué/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.queryByText(/Titre débloqué/)).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/quests/TitleUnlockToast.spec.tsx`
Expected: FAIL — `Cannot find module './TitleUnlockToast'`.

- [ ] **Step 3: Implement `src/components/quests/TitleUnlockToast.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { resolveRarityBadgeStyle, resolveRarityLabel } from '../../lib/titles';
import type { MyTitle } from '../../services/quests';

interface TitleUnlockToastProps {
  titles: MyTitle[];
}

const AUTO_DISMISS_MS = 6000;

const Toast: React.FC<{ title: MyTitle; onDismiss: () => void }> = ({ title, onDismiss }) => {
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timeout);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-3 rounded-2xl border-2 shadow-lg font-bold animate-pop-in',
        resolveRarityBadgeStyle(title.rarity)
      )}
    >
      <span>🏆</span>
      <span>
        Titre débloqué : {title.label} ({resolveRarityLabel(title.rarity)})
      </span>
    </div>
  );
};

export const TitleUnlockToast: React.FC<TitleUnlockToastProps> = ({ titles }) => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = titles.filter((t) => !dismissed.has(t.id));

  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      {visible.map((title) => (
        <Toast
          key={title.id}
          title={title}
          onDismiss={() => setDismissed((prev) => new Set(prev).add(title.id))}
        />
      ))}
    </div>
  );
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/quests/TitleUnlockToast.spec.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/quests/TitleUnlockToast.tsx src/components/quests/TitleUnlockToast.spec.tsx
git commit -m "feat: add the title-unlock toast component"
```

---

### Task 10: Wire the unlock toast into `GamePage`/`PodiumView`

**Files:**

- Modify: `src/pages/GamePage.tsx`
- Modify: `src/views/PodiumView.tsx`
- Modify: `src/pages/GamePage.replay.spec.tsx`

**Interfaces:**

- Consumes: `useTitleUnlocks` from Task 8, `<TitleUnlockToast>` from Task 9.
- Produces: `PodiumViewProps.newTitles?: MyTitle[]` (defaults to `[]`).

- [ ] **Step 1: Update `PodiumView` to accept and render `newTitles`**

In `src/views/PodiumView.tsx`, add imports:

```tsx
import { TitleUnlockToast } from '../components/quests/TitleUnlockToast';
import type { MyTitle } from '../services/quests';
```

Update the props interface and destructuring:

```tsx
interface PodiumViewProps {
  game: Game;
  currentPlayerId: string | null;
  playerName: string;
  newTitles?: MyTitle[];
}

export const PodiumView: React.FC<PodiumViewProps> = ({
  game,
  currentPlayerId,
  playerName,
  newTitles = [],
}) => {
```

Render the toast as the first child of the root `<div>` (before the `<h1>Résultats Finaux</h1>`):

```tsx
      <TitleUnlockToast titles={newTitles} />
      <h1 className="text-4xl font-black text-center text-primary">Résultats Finaux</h1>
```

- [ ] **Step 2: Wire `useTitleUnlocks` into `GamePage`**

In `src/pages/GamePage.tsx`, add the import:

```tsx
import { useTitleUnlocks } from '../hooks/useTitleUnlocks';
```

Call the hook right after `resetGame`/`error`/`game` are destructured from `useGame()`, and pass the result to `PodiumView`:

```tsx
  const { client, game, error, resetGame } = useGame();
  const newTitles = useTitleUnlocks(game?.state ?? null, game?.id);
```

```tsx
    case GameState.FINISHED:
      return (
        <PodiumView
          game={game}
          currentPlayerId={client.getPlayerId()}
          playerName={playerName}
          newTitles={newTitles}
        />
      );
```

- [ ] **Step 3: Update `GamePage.replay.spec.tsx` to satisfy the new `useAuth`/`useQuery` dependency**

`GamePage` now indirectly calls `useMyTitles()` (via `useTitleUnlocks`), which needs both an `AuthContext` and a `QueryClientProvider` — neither is present in this test today. Replace the full contents of `src/pages/GamePage.replay.spec.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GamePage } from './GamePage';
import { GameContext, type GameContextValue } from '../contexts/GameContext';
import type { GameClient } from '../services/GameClient';
import type { Game } from '../types';

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    client: { authorizedFetch: vi.fn() },
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    reloadUser: vi.fn(),
  }),
}));

const ReplayTrigger: React.FC = () => {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate('/game', { state: { playerName: 'Alice', token: null } })}>
      Replay
    </button>
  );
};

describe('GamePage - reconnecting on same-path navigation (replay)', () => {
  it('re-connects when navigating to /game again with the same player name/token', () => {
    const connectToQuickGame = vi.fn();
    const resetGame = vi.fn();
    const game: Game = {
      id: 'G1',
      state: 'WAITING',
      players: [],
      questions: [],
      current_question_index: -1,
      answers: [],
      start_time_current_question: null,
    };
    const client = {
      connectToQuickGame,
      connectToLobby: vi.fn(),
      disconnect: vi.fn(),
      getPlayerId: vi.fn().mockReturnValue(null),
    } as unknown as GameClient;

    const contextValue: GameContextValue = {
      client,
      game,
      error: null,
      clearError: vi.fn(),
      resetGame,
    };

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={[{ pathname: '/game', state: { playerName: 'Alice', token: null } }]}
        >
          <GameContext.Provider value={contextValue}>
            <Routes>
              <Route path="/game" element={<GamePage />} />
            </Routes>
            <ReplayTrigger />
          </GameContext.Provider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(connectToQuickGame).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Replay'));

    expect(connectToQuickGame).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 4: Run the whole suite**

Run: `npx tsc -b && npm run test`
Expected: no type errors, all tests PASS (this also re-verifies `App.podium.spec.tsx`, which renders `PodiumView` directly with no `newTitles` prop — the `= []` default keeps it passing unchanged).

- [ ] **Step 5: Commit**

```bash
git add src/pages/GamePage.tsx src/views/PodiumView.tsx src/pages/GamePage.replay.spec.tsx
git commit -m "feat: wire the title-unlock toast into the podium via GamePage"
```

---

### Task 11: Quest progress card — `src/components/quests/QuestProgressCard.tsx`

**Files:**

- Create: `src/components/quests/QuestProgressCard.tsx`
- Test: `src/components/quests/QuestProgressCard.spec.tsx`

**Interfaces:**

- Consumes: `Quest`, `MyQuest` types from Task 3, `cn` from `src/lib/utils.ts`.
- Produces: `<QuestProgressCard quest={Quest} progress={MyQuest} selectedTitleId={string | null} onEquip={(titleId: string | null) => void} isPending={boolean} />`.

- [ ] **Step 1: Write the failing tests**

Create `src/components/quests/QuestProgressCard.spec.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuestProgressCard } from './QuestProgressCard';
import type { MyQuest, Quest } from '../../services/quests';

const quest: Quest = {
  id: 'win-streak',
  label: "Terminer 1er en parties d'affilée",
  tiers: [
    { threshold: 5, title: { id: 'win-streak-bronze', label: 'Petit Conquérant', rarity: 'BRONZE' } },
    { threshold: 10, title: { id: 'win-streak-silver', label: 'Top Player', rarity: 'SILVER' } },
  ],
};

const progress: MyQuest = {
  id: 'win-streak',
  label: quest.label,
  progress: 7,
  tiers: [
    { threshold: 5, title_id: 'win-streak-bronze', unlocked: true },
    { threshold: 10, title_id: 'win-streak-silver', unlocked: false },
  ],
};

describe('QuestProgressCard', () => {
  it('shows an Équiper button on unlocked tiers and no button on locked tiers', () => {
    render(
      <QuestProgressCard
        quest={quest}
        progress={progress}
        selectedTitleId={null}
        onEquip={vi.fn()}
        isPending={false}
      />
    );

    expect(screen.getByText('Équiper')).toBeInTheDocument();
    expect(screen.getByText('Top Player (10)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /top player/i })).not.toBeInTheDocument();
  });

  it('shows Équipé and calls onEquip(null) when the equipped tier is clicked', () => {
    const onEquip = vi.fn();
    render(
      <QuestProgressCard
        quest={quest}
        progress={progress}
        selectedTitleId="win-streak-bronze"
        onEquip={onEquip}
        isPending={false}
      />
    );

    fireEvent.click(screen.getByText('✓ Équipé'));
    expect(onEquip).toHaveBeenCalledWith(null);
  });

  it('calls onEquip with the tier title id when Équiper is clicked', () => {
    const onEquip = vi.fn();
    render(
      <QuestProgressCard
        quest={quest}
        progress={progress}
        selectedTitleId={null}
        onEquip={onEquip}
        isPending={false}
      />
    );

    fireEvent.click(screen.getByText('Équiper'));
    expect(onEquip).toHaveBeenCalledWith('win-streak-bronze');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/quests/QuestProgressCard.spec.tsx`
Expected: FAIL — `Cannot find module './QuestProgressCard'`.

- [ ] **Step 3: Implement `src/components/quests/QuestProgressCard.tsx`**

```tsx
import React from 'react';
import { cn } from '../../lib/utils';
import type { MyQuest, Quest } from '../../services/quests';

interface QuestProgressCardProps {
  quest: Quest;
  progress: MyQuest;
  selectedTitleId: string | null;
  onEquip: (titleId: string | null) => void;
  isPending: boolean;
}

export const QuestProgressCard: React.FC<QuestProgressCardProps> = ({
  quest,
  progress,
  selectedTitleId,
  onEquip,
  isPending,
}) => {
  return (
    <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-700">{quest.label}</h3>
        <span className="text-xs font-bold text-slate-400">{progress.progress}</span>
      </div>
      <div className="space-y-2">
        {quest.tiers.map((tier) => {
          const tierProgress = progress.tiers.find((t) => t.threshold === tier.threshold);
          const unlocked = tierProgress?.unlocked ?? false;
          const equipped = unlocked && tier.title.id === selectedTitleId;

          return (
            <div
              key={tier.threshold}
              className={cn(
                'flex items-center justify-between gap-2 px-3 py-2 rounded-xl',
                unlocked ? 'bg-white border border-slate-200' : 'bg-slate-100'
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={unlocked ? 'text-primary' : 'text-slate-300'}>
                  {unlocked ? '●' : '○'}
                </span>
                <span
                  className={cn(
                    'text-sm font-bold truncate',
                    unlocked ? 'text-slate-700' : 'text-slate-400'
                  )}
                >
                  {tier.title.label} ({tier.threshold})
                </span>
              </div>
              {unlocked && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onEquip(equipped ? null : tier.title.id)}
                  className={cn(
                    'shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50',
                    equipped
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                  )}
                >
                  {equipped ? '✓ Équipé' : 'Équiper'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/quests/QuestProgressCard.spec.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/quests/QuestProgressCard.tsx src/components/quests/QuestProgressCard.spec.tsx
git commit -m "feat: add QuestProgressCard with inline equip/unequip"
```

---

### Task 12: `/quests` page — `src/pages/QuestsPage.tsx`

**Files:**

- Create: `src/pages/QuestsPage.tsx`
- Test: `src/pages/QuestsPage.spec.tsx`

**Interfaces:**

- Consumes: `useAuth()`, `useQuestCatalog`/`useMyTitles`/`useSelectTitle` from Task 4, `<QuestProgressCard>` from Task 11.
- Produces: `<QuestsPage />` React component (routed in Task 13).

- [ ] **Step 1: Write the failing tests**

Create `src/pages/QuestsPage.spec.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuestsPage } from './QuestsPage';
import type { MyTitlesResponse, QuestCatalog } from '../services/quests';

const quest: QuestCatalog[number] = {
  id: 'win-streak',
  label: "Terminer 1er en parties d'affilée",
  tiers: [
    { threshold: 5, title: { id: 'win-streak-bronze', label: 'Petit Conquérant', rarity: 'BRONZE' } },
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/pages/QuestsPage.spec.tsx`
Expected: FAIL — `Cannot find module './QuestsPage'`.

- [ ] **Step 3: Implement `src/pages/QuestsPage.tsx`**

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { useMyTitles, useQuestCatalog, useSelectTitle } from '../hooks/useQuests';
import { QuestProgressCard } from '../components/quests/QuestProgressCard';

const QuestsNotice: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4">
      <h1 className="text-3xl font-black text-primary-dark">Quêtes &amp; Titres</h1>
      <p className="text-slate-600">{message}</p>
      <Link to="/" className="inline-block text-primary font-bold hover:underline">
        Retour à l'accueil
      </Link>
    </div>
  </div>
);

export const QuestsPage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const catalogQuery = useQuestCatalog();
  const myTitlesQuery = useMyTitles();
  const selectTitle = useSelectTitle();

  if (authLoading || (isAuthenticated && (catalogQuery.isLoading || myTitlesQuery.isLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-lg font-bold animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <QuestsNotice message="Connecte-toi pour voir tes quêtes et tes titres." />;
  }

  if (!catalogQuery.data || !myTitlesQuery.data) {
    return <QuestsNotice message="Impossible de charger tes quêtes pour le moment." />;
  }

  const { titles, quests, selected_title_id } = myTitlesQuery.data;

  return (
    <div className="min-h-screen p-4 pt-20 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-black text-primary-dark">Quêtes &amp; Titres</h1>

      {titles.length === 0 && (
        <p className="text-slate-500 text-sm bg-white rounded-2xl border-2 border-slate-100 p-4">
          Aucun titre débloqué pour l'instant. Progresse dans les quêtes ci-dessous pour en gagner
          !
        </p>
      )}

      <div className="space-y-4">
        {catalogQuery.data.map((quest) => {
          const questProgress = quests.find((q) => q.id === quest.id);
          if (!questProgress) return null;

          return (
            <QuestProgressCard
              key={quest.id}
              quest={quest}
              progress={questProgress}
              selectedTitleId={selected_title_id}
              onEquip={(titleId) => selectTitle.mutate(titleId)}
              isPending={selectTitle.isPending}
            />
          );
        })}
      </div>

      <div className="text-center pb-8">
        <Link
          to="/profile"
          className="block text-sm font-bold text-slate-500 hover:text-primary transition-colors"
        >
          ← Retour au profil
        </Link>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/pages/QuestsPage.spec.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/pages/QuestsPage.tsx src/pages/QuestsPage.spec.tsx
git commit -m "feat: add the /quests page (progress + equip/unequip)"
```

---

### Task 13: Routing — `/quests` route + header link

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/components/Header.tsx`
- Create: `src/components/Header.spec.tsx`

**Interfaces:**

- Consumes: `<QuestsPage>` from Task 12.

- [ ] **Step 1: Write the failing test**

Create `src/components/Header.spec.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    client: {},
    user: { username: 'Tim' },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    reloadUser: vi.fn(),
  }),
}));

vi.mock('./streak/StreakBadge', () => ({ StreakBadge: () => null }));

describe('Header - user menu', () => {
  it('links to /quests between the profile link and the logout button', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Tim'));

    const links = screen.getAllByRole('link').map((el) => el.textContent);
    const profileIndex = links.indexOf('Mon profil');
    expect(profileIndex).toBeGreaterThanOrEqual(0);
    expect(links[profileIndex + 1]).toBe('Quêtes & Titres');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/Header.spec.tsx`
Expected: FAIL — no "Quêtes & Titres" link exists yet.

- [ ] **Step 3: Add the route in `src/App.tsx`**

Add the import:

```tsx
import { QuestsPage } from './pages/QuestsPage';
```

Add the route right after `profile` under `AppLayout`:

```tsx
            <Route path="profile" element={<ProfilePage />} />
            <Route path="quests" element={<QuestsPage />} />
```

- [ ] **Step 4: Add the header link in `src/components/Header.tsx`**

Insert a new `<Link>` between the "Mon profil" link and the "Se déconnecter" button:

```tsx
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Mon profil
                    </Link>
                    <Link
                      to="/quests"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 border-t border-slate-100"
                    >
                      Quêtes &amp; Titres
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 border-t border-slate-100"
                    >
                      Se déconnecter
                    </button>
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/Header.spec.tsx`
Expected: PASS (1 test).

- [ ] **Step 6: Run the whole suite**

Run: `npx tsc -b && npm run test`
Expected: no type errors, all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/components/Header.tsx src/components/Header.spec.tsx
git commit -m "feat: route /quests and link it from the header user menu"
```

---

### Task 14: Docs, changelog, version bump

**Files:**

- Create: `doc/quests-titles.md`
- Modify: `doc/index.md`
- Modify: `doc/game-views.md`
- Modify: `doc/routing.md`
- Modify: `doc/player-profile.md`
- Modify: `CHANGELOG.md`
- Modify: `package.json`, `package-lock.json` (via `npm version`)

- [ ] **Step 1: Create `doc/quests-titles.md`**

```markdown
# Quêtes & Titres

A player unlocks cosmetic **titles** (rarities `BRONZE`/`SILVER`/`GOLD`/`DIAMOND`) by
progressing through **quests** (e.g. "win N games in a row"). An unlocked title can be
equipped and is then visible to other players in the lobby and podium, alongside
`level`/`grade`/`daily_streak`.

## Backend contract

Three REST routes (`src/services/quests/`, port/adapter pattern):

| Route | Auth | Notes |
| --- | --- | --- |
| `GET /quests` | none | Public catalog, cacheable long (`staleTime: Infinity` in `useQuestCatalog`) |
| `GET /me/titles` | Bearer | Player's unlocked titles + per-quest progress + equipped title id |
| `PUT /me/selected-title` | Bearer | `{ title_id: string \| null }` → equip/unequip |

No WS event fires on unlock — the calculation happens server-side, asynchronously, at
the end of a game.

## Data layer (`src/services/quests/`)

Same shape as `src/services/streak/` (see `doc/streak.md`): `port.ts` (types +
`QuestsRepository`), `HttpQuestsAdapter.ts`, `index.ts` (exports the `questsRepository`
singleton).

## Hooks (`src/hooks/useQuests.ts`)

`useQuestCatalog()`, `useMyTitles()` (enabled only when authenticated), `useSelectTitle()`
(invalidates `['my-titles']` on success). No dedicated Context/Provider — unlike the
streak (always visible in the `Header`), titles are only consumed by the `/quests` page
and by the unlock-detection hook below.

## Rarity styling (`src/lib/titles.ts`)

`resolveRarityLabel`/`resolveRarityTextColor`/`resolveRarityBadgeStyle`, mirrors
`lib/grades.ts`. Falls back to a default style for any rarity not in `RARITIES` — the
backend contract treats the rarity list as open.

## Display in game (lobby + podium)

`PlayerTitle` (`src/components/PlayerTitle.tsx`) renders `null` when `player.title` is
`null`, otherwise a small colored line under the player's name. Wired into `LobbyView`
(player card) and `PodiumView`'s full ranking — **not** shown in the podium's top-3
columns, same rule as the grade ring (see `doc/game-views.md`).

`player.title` is a snapshot taken at `JOIN`, just like `level`/`grade`/`daily_streak` —
equipping a different title mid-game only takes effect in the next game.

## `/quests` page (`src/pages/QuestsPage.tsx`)

Route `/quests`, linked from the `Header` user menu between "Mon profil" and
"Se déconnecter". For each quest in the catalog, `QuestProgressCard` shows every tier
with an inline **Équiper**/**✓ Équipé** button on unlocked tiers (clicking the equipped
tier unequips it); locked tiers are greyed out with no action.

## Unlock toast (`useTitleUnlocks` + `TitleUnlockToast`)

No server event for unlocks, so the front detects them by diffing `GET /me/titles`:

1. `useTitleUnlocks(gameState, gameId)` (`src/hooks/useTitleUnlocks.ts`) snapshots the
   known title ids continuously while `gameState` is `WAITING`/`COUNTDOWN`, freezes the
   snapshot once `IN_PROGRESS` starts, and resets when `gameId` changes (new game).
2. At `FINISHED`, it refetches `['my-titles']` and diffs against the frozen snapshot. If
   nothing is new, it retries once after `RETRY_DELAY_MS` (1.5s) — the backend
   calculation is asynchronous.
3. `GamePage` passes the result to `PodiumView` as `newTitles`, rendered by
   `TitleUnlockToast` (`src/components/quests/`), one auto-dismissing toast per newly
   unlocked title.

If the player never passed through `WAITING`/`COUNTDOWN` in this `GamePage` mount (e.g.
reconnect mid-game), no snapshot exists and detection is skipped entirely rather than
guessing.
```

- [ ] **Step 2: Update `doc/index.md`**

Add a new bullet in the "Feature index" section, right after the `streak.md` entry:

```markdown
### [quests-titles.md](quests-titles.md)

Quêtes progressives et titres cosmétiques : route `/quests`, service hexagonal
`services/quests` (`GET /quests`, `GET /me/titles`, `PUT /me/selected-title`), composants
`PlayerTitle` / `QuestProgressCard` / `TitleUnlockToast`, et la détection de déblocage par
diff (`useTitleUnlocks`).
→ Read when: modifying quest/title display, thresholds, or the unlock-toast detection.
```

- [ ] **Step 3: Update `doc/game-views.md`**

In the "Player vitrine (grade + streak)" section, extend the first paragraph and the
"Wired into" paragraph to mention `title`:

Replace:

```markdown
Each `Player` snapshot carries `level`, `grade` and `daily_streak` (set at game entry, immutable during the game — see the backend contract). Two shared components surface them:

- `PlayerAvatar` (`src/components/PlayerAvatar.tsx`): the round initials avatar with a **grade-colored ring** (`resolveGradeRingColor` in `src/lib/grades.ts`), sizes `sm | md | lg`. Bots get a slate fill but still show their grade ring. The ring can be turned off with `showGradeRing={false}`.
- `PlayerStreak` (`src/components/PlayerStreak.tsx`): the streak flame + count, or `null` when `daily_streak <= 0` (see `doc/streak.md`).

Wired into `LobbyView` (player cards) and `PodiumView`. On the podium the grade ring is shown only in the full ranking; the top-3 columns pass `showGradeRing={false}` to avoid duplicating it. **Not** shown in the in-game `GameView` scoreboard by design. `level` is intentionally not displayed anywhere yet.
```

With:

```markdown
Each `Player` snapshot carries `level`, `grade`, `daily_streak` and `title` (set at game entry, immutable during the game — see the backend contract). Three shared components surface them:

- `PlayerAvatar` (`src/components/PlayerAvatar.tsx`): the round initials avatar with a **grade-colored ring** (`resolveGradeRingColor` in `src/lib/grades.ts`), sizes `sm | md | lg`. Bots get a slate fill but still show their grade ring. The ring can be turned off with `showGradeRing={false}`.
- `PlayerStreak` (`src/components/PlayerStreak.tsx`): the streak flame + count, or `null` when `daily_streak <= 0` (see `doc/streak.md`).
- `PlayerTitle` (`src/components/PlayerTitle.tsx`): the equipped title label colored by rarity, or `null` when `title === null` (see `doc/quests-titles.md`).

Wired into `LobbyView` (player cards) and `PodiumView`. On the podium the grade ring and the title are shown only in the full ranking; the top-3 columns pass `showGradeRing={false}` and never read `title`, to avoid crowding those constrained columns. **Not** shown in the in-game `GameView` scoreboard by design. `level` is intentionally not displayed anywhere yet.
```

- [ ] **Step 4: Update `doc/routing.md`**

In the route tree, add `/quests` right after `/profile`:

```
│   ├── /profile    → ProfilePage
│   ├── /quests     → QuestsPage
```

In the "Footer" bullet's route list, add `/quests` alongside the other non-home routes.

Add a bullet under "Navigation between pages":

```markdown
- `Header` → user menu → "Quêtes & Titres" → `navigate('/quests')` (authenticated users only, see `doc/quests-titles.md`)
```

- [ ] **Step 5: Update `doc/player-profile.md`**

Add a line at the end of the "Overview" section:

```markdown
The title equipped via `/quests` (see `doc/quests-titles.md`) is not shown on this page — it surfaces in the lobby/podium and on `/quests` itself.
```

- [ ] **Step 6: Add the `CHANGELOG.md` entry**

Insert a new section at the top of `CHANGELOG.md`, right after the `# Calc Rush Front` heading:

```markdown
## [Unreleased]

### Added

- Quests & titles: players unlock cosmetic titles (`BRONZE`/`SILVER`/`GOLD`/`DIAMOND` rarities) by progressing through quests, and can equip one from a new `/quests` page (linked from the header user menu). The equipped title is snapshotted per-player at `JOIN` (like `level`/`grade`/`daily_streak`) and shown in the lobby and the podium's full ranking (not the top-3 columns). No WS event fires on unlock; the podium detects new titles by diffing `GET /me/titles` against a lobby-time snapshot and shows an auto-dismissing toast (`useTitleUnlocks`, `TitleUnlockToast`).
```

- [ ] **Step 7: Run the full validation suite**

Run: `./scripts/validate.sh`
Expected: lint, prettier, tsc, and all tests PASS.

- [ ] **Step 8: Bump the version and commit**

```bash
git add doc/quests-titles.md doc/index.md doc/game-views.md doc/routing.md doc/player-profile.md CHANGELOG.md
git commit -m "docs: quests & titles feature documentation"
npm version minor -m "%s"
```

`npm version minor` bumps `package.json`/`package-lock.json` and creates its own commit +
tag (per `CLAUDE.md`'s "Before push" checklist — this is a new feature, hence `minor`).

---

## Self-Review Notes

- **Spec coverage:** every section of `docs/superpowers/specs/2026-07-12-quests-and-titles-design.md` maps to a task — §1 types/validation → Task 1; §2 lib/titles → Task 2; §3 services/quests → Task 3; §3 hooks → Task 4; §4 lobby/podium display → Tasks 5–7; §5 `/quests` page → Tasks 11–12; §6 toast → Tasks 8–10; routing/header → Task 13; tests → embedded in every task; release → Task 14.
- **Type consistency checked:** `PlayerTitle` (types.ts) vs `QuestTitle`/`MyTitle` (services/quests/port.ts) are deliberately distinct types for distinct shapes (WS snapshot vs. catalog entry vs. unlocked-titles entry) — no accidental name reuse across tasks. `MY_TITLES_QUERY_KEY` from Task 4 is what Task 8's `useMyTitles()` call implicitly uses (no separate key is redefined). `RETRY_DELAY_MS` is exported from Task 8's own file and only consumed by its own test.
- **No placeholders:** every step has runnable code; nothing deferred to "later".
