# Player Profile

## Overview

The `ProfilePage` (`src/pages/ProfilePage.tsx`) is accessible only to authenticated users at `/profile`. It displays:

- Username and avatar (initials)
- School level (e.g. CM2, 6ème) and grade (Bronze → Diamond)
- A segmented XP bar by grade
- The level promotion button if `can_promote === true`
- Game history

The title equipped via `/quests` (see `doc/quests-titles.md`) is not shown on this page — it surfaces in the lobby/podium and on `/quests` itself.

## Types (src/types.ts)

### PlayerProfile

```typescript
interface PlayerProfile {
  username: string;
  level: string; // key among levels (e.g. 'CM2', 'SIXIEME')
  experience: number; // total cumulated XP
  grade: string; // key among grades (e.g. 'BRONZE', 'GOLD')
  can_promote: boolean;
  history: GameHistoryEntry[];
}
```

### GameConfig

```typescript
interface GameConfig {
  experience_per_grade: number; // XP required per grade
  promotion_threshold: number;
  grades: string[]; // ['BRONZE', 'SILVER', 'GOLD', 'PLATINE', 'DIAMOND']
  levels: string[]; // ['CP', 'CE1', 'CE2', 'CM1', 'CM2', 'SIXIEME', ...]
}
```

### GameHistoryEntry

```typescript
interface GameHistoryEntry {
  id: string;
  played_at: string; // ISO 8601
  duration_seconds: number;
  is_quick_game: boolean;
  questions_count: number;
  winner_display_name: string | null;
  my_rank: number;
  my_score: number;
  my_correct_answers: number;
  my_total_answers: number;
  experience_gained: number; // can be negative
  participants: GameHistoryParticipant[];
}
```

## API calls

| Call         | Endpoint                           | Description                                                   |
| ------------ | ---------------------------------- | ------------------------------------------------------------- |
| Load config  | `GET /game/config`                 | Public. Grades, levels, XP per grade.                         |
| Load profile | `GET /me/details` (authenticated)  | Full profile with history. 404 if first-time player.          |
| Promotion    | `POST /me/promote` (authenticated) | Promotes one level if `can_promote`. Returns updated profile. |

Every call is defined in a `services/` module (`gameConfig.ts`, `profile.ts`), validated with a zod schema, and consumed via a TanStack Query hook (`useGameConfig`, `usePlayerProfile`, `usePromotePlayer` in `src/hooks/`). `/me/...` calls go through `client.authorizedFetch()` (automatic token refresh) passed as the fetcher to the service function.

## Grade and level system

**Grades** (in order): BRONZE → SILVER → GOLD → PLATINE → DIAMOND

Each grade requires `experience_per_grade` XP. The XP bar is visually segmented into as many sections as there are grades.

**School levels** (in order): CP → CE1 → CE2 → CM1 → CM2 → SIXIÈME → CINQUIÈME → QUATRIÈME → TROISIÈME → SECONDE → PREMIÈRE → TERMINALE

**Promotion** changes the school level (not the grade). It is available when `can_promote === true`, meaning the player has reached the DIAMOND grade at their current level.

## Internal components of ProfilePage

| Component        | Role                                          |
| ---------------- | --------------------------------------------- |
| `GradeBadge`     | Colored badge displaying the grade label      |
| `SegmentedXpBar` | Multi-segment XP bar, one section per grade   |
| `HistoryRow`     | Expandable history row with participant table |

## Adding a profile feature

- New stat → add to `PlayerProfile` (types.ts), its zod schema (`services/gameSchemas.ts` or `services/profile.ts`) and in `ProfilePage` rendering
- New badge / rank → add to the label/style `Record<Grade, string>` maps in `src/lib/grades.ts`
- New profile action → add a service function in `services/profile.ts` and a `useMutation` hook in `src/hooks/usePlayerProfile.ts`
