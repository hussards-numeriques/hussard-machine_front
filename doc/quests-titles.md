# Quêtes & Titres

A player unlocks cosmetic **titles** (rarities `BRONZE`/`SILVER`/`GOLD`/`DIAMOND`) by
progressing through **quests** (e.g. "win N games in a row"). An unlocked title can be
equipped and is then visible to other players in the lobby and podium, alongside
`level`/`grade`/`daily_streak`.

## Backend contract

Three REST routes (`src/services/quests/`, port/adapter pattern):

| Route                    | Auth   | Notes                                                                       |
| ------------------------ | ------ | --------------------------------------------------------------------------- |
| `GET /quests`            | none   | Public catalog, cacheable long (`staleTime: Infinity` in `useQuestCatalog`) |
| `GET /me/titles`         | Bearer | Player's unlocked titles + per-quest progress + equipped title id           |
| `PUT /me/selected-title` | Bearer | `{ title_id: string \| null }` → equip/unequip                              |

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
