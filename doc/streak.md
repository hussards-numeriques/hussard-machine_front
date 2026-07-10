# Streak — Daily streak badge

A player who answers at least one question per day builds a "streak" (consecutive days played). Authenticated only — the streak is tied to the account, not the device.

## Backend contract

`GET /me/streak` (via `authorizedFetch`, so it requires a valid access token).

### StreakResponse

```typescript
{
  current_count: number; // consecutive days played, 0 if the streak is broken
  played_today: boolean; // whether today already counts
  freeze_available_on: string | null; // ISO date (YYYY-MM-DD) when the freeze safety net is back, or null if already available
}
```

The "freeze" is a backend-side safety net: missing one day doesn't necessarily reset the streak immediately, but it goes on cooldown (`freeze_available_on` set to a future date) until it's available again.

## Data layer (src/services/streak/)

Port/adapter pattern (see `doc/conventions.md`).

| File                   | Role                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| `port.ts`              | `StreakResponse`, `AuthorizedFetch` type, `StreakRepository` interface                                     |
| `HttpStreakAdapter.ts` | Implementation calling `GET /me/streak` via the injected `AuthorizedFetch`                                 |
| `index.ts`             | Exports the resolved `streakRepository` instance (`new HttpStreakAdapter()`) and re-exports the port types |
| `status.ts`            | `deriveStreakStatus(streak, now?)` — pure function turning a `StreakResponse` into a `StreakStatus`        |

`AuthorizedFetch` mirrors `AuthClient.authorizedFetch`'s signature so the adapter doesn't depend on `AuthClient` directly — the caller injects it (see `StreakProvider` below).

### deriveStreakStatus

```typescript
interface StreakStatus {
  count: number;
  isAlive: boolean; // current_count > 0
  freezeReady: boolean; // freeze_available_on === null
  atRisk: boolean; // isAlive && !played_today
  lastChance: boolean; // atRisk && !freezeReady
  daysUntilFreeze: number | null; // days until freeze_available_on, 0 if past/today
}
```

`atRisk` means the player hasn't played today and could lose the streak; `lastChance` means the freeze safety net is on cooldown too, so playing today is the only way to keep the streak.

## StreakProvider / useStreak (src/contexts/)

| File                 | Role                                                            |
| -------------------- | --------------------------------------------------------------- |
| `StreakContext.ts`   | Defines `StreakContextValue` (`streak`, `isLoading`, `refresh`) |
| `StreakProvider.tsx` | Fetches the streak on mount and whenever auth state changes     |
| `useStreak.ts`       | `useStreak()` hook, throws if used outside `StreakProvider`     |

`StreakProvider` reads `client`/`isAuthenticated` from `useAuth()` and calls `streakRepository.fetchStreak` with `client.authorizedFetch` bound as the `AuthorizedFetch`. If the user isn't authenticated, `streak` stays `null` and no request is made. Fetch failures are swallowed (`streak` reset to `null`).

### Placement in the React tree

`StreakProvider` is mounted **inside** `AuthProvider`, in both `AppLayout` and `GameLayout` — unlike `AuthProvider`, which only wraps `AppLayout` (see `doc/auth.md`). This means the streak badge is also available during a game.

## UI components (src/components/streak/)

### StreakBadge

Rendered in `Header`, **authenticated users only** (returns `null` if `!isAuthenticated || !streak`). Shows, in a pill:

1. The current count (`status.count`), colored per tier, hidden if the streak is dead (`!isAlive`)
2. `StreakFlame` (muted/grayscale if `!isAlive`)
3. `DailyQuestIcon`, wrapped in a button when `questState` is not `'neutral'` (opens a popover on click, closed on outside click). For `'secured'`, the popover shows a live `HH:MM:SS` countdown to the next daily quest reset, assumed to be 00:00 UTC since the backend doesn't expose a precise reset time (`useUtcMidnightCountdown` hook, ticking only while the popover is open).

`questState` derivation: `played_today` → `'secured'`; else `lastChance` → `'last-chance'`; else `atRisk` → `'soft-risk'`; else `'neutral'`.

### StreakFlame (src/components/streak/StreakFlame/)

Evolving flame icon, one component per tier, selected by `getStreakTier(count)`:

| Tier (`TierId`) | Min count | Component     | Value text color  |
| --------------- | --------- | ------------- | ----------------- |
| `ember`         | 1         | `EmberFlame`  | `text-orange-400` |
| `orange`        | 3         | `OrangeFlame` | `text-orange-500` |
| `amber`         | 7         | `AmberFlame`  | `text-amber-500`  |
| `blue`          | 14        | `BlueFlame`   | `text-sky-500`    |
| `violet`        | 30        | `VioletFlame` | `text-violet-600` |
| `gold`          | 60        | `GoldFlame`   | `text-amber-500`  |

`STREAK_TIERS` is sorted highest-`min`-first; `getStreakTier` returns the first tier whose `min` is reached, falling back to `ember`. `StreakFlame` itself is a thin wrapper: `getStreakTier(count).Flame` rendered with the remaining `FlameProps` (`size`, `animated`, `muted`).

> The flame visuals (shapes, gradients) are functional but intentionally left open for a later design pass — this is the one part of the feature expected to be refined visually after release.

### DailyQuestIcon

Small SVG status icon with 4 states (`QuestState`): `'secured'` (green check), `'soft-risk'` (amber ring), `'last-chance'` (red ring, pulsing via `animate-quest-pulse`), `'neutral'` (slate ring, e.g. streak not started or already dead).

### StreakGuide

Static explanatory card (no props, no fetch) rendered by the progression page (`ProgressionPage`, route `/progression`). Four sections: principle, tiers (maps over `STREAK_TIERS` rendering each `tier.Flame` + threshold), the daily quest (the 4 `DailyQuestIcon` states), and the freeze / last-chance safety net. Reuses `STREAK_TIERS` and `DailyQuestIcon` — no new data layer.

## Per-player streak during a game

Each `Player` carries a `daily_streak` snapshot (see `doc/game-views.md`, "player vitrine"). `StreakFlame` is reused via the shared `PlayerStreak` component (`src/components/PlayerStreak.tsx`): it renders `null` when `count <= 0`, otherwise the tier flame plus the count colored with `getStreakTier(count).valueColorClass`. Wired into `LobbyView` and `PodiumView`.
