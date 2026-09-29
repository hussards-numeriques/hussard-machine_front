# Quêtes & Titres

A player unlocks cosmetic **titles** (rarities `BRONZE`/`SILVER`/`GOLD`/`DIAMOND`, displayed Commun/Rare/Épique/Légendaire) by
progressing through **quests** (e.g. "win N games in a row"). An unlocked title can be
equipped and is then visible to other players in the lobby and podium, alongside
`level`/`grade`/`daily_streak`.

**Titles are per school level** (anti-farm: winning 10 CP games in a row must not give a
title shown in 3ème). Quest progress, unlocked titles and the equipped title are all
stored per `Level` by the backend; a game credits progress to **the game's level** (the
lobby level), and the title shown in game is the one equipped for that level. Shared
contract: `hussards_orga/TITLES_PER_LEVEL_CONTRACT.md`.

## Backend contract

Three REST routes (`src/services/quests/`, port/adapter pattern):

| Route                    | Auth   | Notes                                                                                                                                    |
| ------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /quests`            | none   | Public catalog, cacheable long (`staleTime: Infinity` in `useQuestCatalog`)                                                              |
| `GET /me/titles`         | Bearer | `?level=<LEVEL>` optional (absent = account level). Titles + progress + equipped id **for that level**, plus `level` and `current_level` |
| `PUT /me/selected-title` | Bearer | `{ title_id: string \| null, level }` → `{ selected_title_id, level }`; 400 if not unlocked at that level                                |

No WS event fires on unlock — the calculation happens server-side, asynchronously, at
the end of a game.

## Data layer (`src/services/quests/`)

Same shape as `src/services/streak/` (see `doc/streak.md`): `port.ts` (types +
`QuestsRepository`), `HttpQuestsAdapter.ts`, `index.ts` (exports the `questsRepository`
singleton).

## Hooks (`src/hooks/useQuests.ts`)

`useQuestCatalog()`, `useMyTitles(level: Level | null)` (enabled only when authenticated;
query key `myTitlesQueryKey(level)` = `['my-titles', level ?? 'current']`, `null` = account
level; `placeholderData: keepPreviousData` so switching level keeps the page on screen),
`useSelectTitle()` (`mutate({ titleId, level })`, invalidates the `['my-titles']` **prefix**,
i.e. every level). `usePromotePlayer`/`useDemotePlayer` also invalidate the `['my-titles']`
prefix since the account level (the `current` entry and `current_level`) changes. No dedicated Context/Provider — unlike the
streak (always visible in the `Header`), titles are only consumed by the `/quests` page
and by the unlock-detection hook below.

## Rarity styling (`src/lib/rarity.ts`)

`resolveRarityLabel`/`resolveRarityTextStyle`/`resolveRarityBadgeStyle`, mirrors `lib/grades.ts`.
The backend keys stay `BRONZE`/`SILVER`/`GOLD`/`DIAMOND`, but the front **never shows them as
metals**: metal is reserved for the player's grade (avatar ring), so rarity uses the game
vocabulary kids already know — Commun (slate), Rare (sky), Épique (fuchsia), Légendaire
(amber→orange gradient text). A title is always rendered as a **`TitleLabel`**
(`src/components/PlayerTitle.tsx`): italic extra-bold text colored by rarity, an epithet under
the name rather than a badge. `locked` greys it out with a `🔒`. Falls back to a default style for any rarity not in `RARITIES` — the
backend contract treats the rarity list as open.

## Display in game (lobby + podium)

`PlayerTitle` (`src/components/PlayerTitle.tsx`) renders `null` when `player.title` is
`null`, otherwise a `TitleLabel` under the player's name. Wired into `LobbyView`
(player card) and `PodiumView`'s full ranking — **not** shown in the podium's top-3
columns, same rule as the grade ring (see `doc/game-views.md`).

`player.title` is a snapshot taken at `JOIN`, just like `level`/`grade`/`daily_streak` —
equipping a different title mid-game only takes effect in the next game.

## `/quests` page (`src/pages/QuestsPage.tsx`)

Route `/quests`, linked from the `Header` user menu between "Mon profil" and
"Se déconnecter". It opens on the **account level** (`viewedLevel = null`); a
`LevelSelector` ("Niveau affiché", every `LEVELS` entry, current one suffixed "(actuel)")
lets the player browse other levels — picking the current level maps back to `null` so
there is a single cache entry for it.

`resolveTitlesLevelView(response)` (`src/lib/titlesLevelView.ts`) returns a discriminated
union rendered by `TitlesLevelBanner`:

| kind                | when                                      | copy (L = viewed level, C = current)                                                                                                                                                                               |
| ------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `active`            | `level === current_level`                 | **Titres actifs — niveau L.** C'est ton niveau actuel : tes parties en L font avancer ces quêtes, et le titre que tu équipes ici s'affiche en jeu.                                                                 |
| `inactive-memories` | other level with ≥1 title or progress > 0 | **Niveau L — titres inactifs.** Ce n'est plus ton niveau : ces titres ne s'affichent plus en jeu et ne peuvent pas être équipés. Ils sont là pour la nostalgie du passé ! Tes titres actifs sont ceux du niveau C. |
| `inactive-empty`    | other level with nothing                  | **Niveau L — titres inactifs.** Aucun souvenir ici pour l'instant. Seuls les titres de ton niveau actuel (C) sont actifs.                                                                                          |

For each quest in the catalog, `QuestProgressCard` shows a progress bar toward the next
locked tier (« 7 / 10 pour le prochain titre », or « ✓ Quête terminée ») and every tier as a
`TitleLabel` (locked tiers show `🎯 threshold` on the right). Its `mode` prop is a
union: `editable` (active level) shows an inline **Équiper**/**✓ Équipé** button on
unlocked tiers (clicking the equipped tier unequips it, the PUT always sends the viewed
level); `readonly` (inactive level) shows no button, only a **✓ Était équipé** badge on the
tier that is equipped at that level. Locked tiers are greyed out with no action. The
subscription pause banner only shows on the active level; while another level loads
(`isPlaceholderData`) the quest list is dimmed.

Known simplification: a friend lobby can be created at any level, so a game there does
progress (and displays the title of) that "inactive" level; the banner keeps the simple
wording anyway, and equipping stays limited to the account level.

## Level change modal

`LevelChangeConfirmModal` (promote/demote, on `/profile`) takes `targetLevel` and
`currentLevel` labels and adds a titles paragraph:

- promote: « Côté titres, tu passes à la progression de {target} : nouvelles quêtes,
  nouveaux titres à décrocher. Ceux de {current} restent consultables dans Quêtes &
  Titres, mais ne seront plus actifs. »
- demote: « Côté titres, tu retrouves la progression de {target}. Ceux de {current}
  restent consultables dans Quêtes & Titres, mais ne seront plus actifs. »

## Unlock toast (`useTitleUnlocks` + `TitleUnlockToast`)

No server event for unlocks, so the front detects them by diffing `GET /me/titles`:

1. `useTitleUnlocks(gameState, gameId, gameLevel)` (`src/hooks/useTitleUnlocks.ts`)
   reads `useMyTitles(gameLevel)` — the **game's** level (`Game.level`, validated in
   `gameSchema`), since that is where the backend credits progress — and snapshots the
   known title ids (only when `data.level === gameLevel`, guarding against a placeholder
   from another level) continuously while `gameState` is `WAITING`/`COUNTDOWN`, freezes the
   snapshot once `IN_PROGRESS` starts, and resets when `gameId` changes (new game).
2. At `FINISHED`, it refetches `['my-titles']` and diffs against the frozen snapshot. If
   nothing is new, it retries once after `RETRY_DELAY_MS` (1.5s) — the backend
   calculation is asynchronous.
3. `GamePage` passes the result to `PodiumView` as `newTitles`, rendered by
   `TitleUnlockToast` (`src/components/quests/`), one auto-dismissing toast per newly
   unlocked title.

If `gameLevel` is unknown, or the player never passed through `WAITING`/`COUNTDOWN` in this `GamePage` mount (e.g.
reconnect mid-game), no snapshot exists and detection is skipped entirely rather than
guessing.
