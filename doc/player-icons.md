# Player icons — backend contract

Players can now unlock and select a profile icon. Three new/changed REST routes.

## `GET /icons` — public catalog

No auth. Cached (`Cache-Control: public, max-age=604800`).

```json
[
  {
    "id": "subscriber-star",
    "rarity": "GOLD",
    "url": "http://localhost:8000/static/icons/subscriber-star.svg"
  }
]
```

No display name is sent: the front translates the icon `id` with `resolveIconLabel`
(`src/lib/labels.ts`, e.g. `subscriber-star` → « Étoile Abonné »).

`rarity` is one of `BRONZE`/`SILVER`/`GOLD`/`DIAMOND` — same open-ended contract as title
rarities (`doc/quests-titles.md`), treat unknown values gracefully.

## `GET /me/icons` — Bearer required

```json
{
  "selected_icon_id": "subscriber-star",
  "icons": [
    {
      "id": "subscriber-star",
      "rarity": "GOLD",
      "url": "http://localhost:8000/static/icons/subscriber-star.svg",
      "unlocked_at": "2026-08-15T10:00:00Z"
    }
  ]
}
```

`selected_icon_id` is `null` when the player hasn't selected an icon (or owns none).

## `PUT /me/selected-icon` — Bearer required

Request: `{ "icon_id": "subscriber-star" }` (or `{ "icon_id": null }` to unequip).
Response: `{ "selected_icon_id": "subscriber-star" }`.
`400` if `icon_id` isn't unlocked by the player.

## `GET /me/details` — new field

`PlayerProfileResponse` now includes:

```json
{
  "selected_icon_url": "http://localhost:8000/static/icons/subscriber-star.svg"
}
```

`null` when the player has no icon selected. This is a pure addition — every other field
is unchanged.

## How an icon is granted today

Two paths are wired. Practice: each question requested on the practice routes counts as effort,
and the player gets `practice-bronze` (BRONZE, 100 questions), `practice-silver` (SILVER, 300),
`practice-gold` (GOLD, 1000) and `practice-diamond` (DIAMOND, 3000). The question response
carries `unlocked_icon` on the request that crosses a threshold (see `doc/practice.md`).
Subscription: taking a subscription (Stripe checkout or a redeem code) unlocks
the `subscriber-star` icon automatically, asynchronously (no WS event, same
fetch-and-diff caveat as title unlocks — see `doc/quests-titles.md`'s unlock-toast
section if icon-unlock notifications are wanted later). No easter eggs or season pass
exist yet — the backend has the extension point but nothing else grants an icon today.

## Front-end

### Data layer (`src/services/icons/`)

Same shape as `src/services/quests/` (see `doc/quests-titles.md`): `port.ts` (types +
`IconsRepository`), `HttpIconsAdapter.ts`, `index.ts` (exports the `iconsRepository`
singleton).

### Hooks (`src/hooks/useIcons.ts`)

`useIconCatalog()`, `useMyIcons()` (enabled only when authenticated), `useSelectIcon()`
(invalidates `['my-icons']` **and** `['player-profile']` on success — the equipped icon
is reflected in `/me/details.selected_icon_url`, consumed by `ProfilePage`'s avatar).

### Rarity styling (`src/lib/rarity.ts`)

Shared with titles — same module, renamed from `lib/titles.ts` since both features use
the same `BRONZE`/`SILVER`/`GOLD`/`DIAMOND` system, displayed as Commun/Rare/Épique/Légendaire
(never as metals — metal means grade, see `doc/quests-titles.md`).

### `/icons` page (`src/pages/IconsPage.tsx`)

Route `/icons`, linked from the `Header` user menu next to "Quêtes & Titres". Grid of
`IconCard` (`src/components/icons/`) — unlocked icons show an inline
**Équiper**/**✓ Équipé** button (clicking the equipped card unequips it); locked icons
are greyed out with no action.

### Unlock toast (`src/components/icons/IconUnlockToast.tsx`)

Modelled on `TitleUnlockToast`: `unlock` sound, `icons.unlocked` with the rarity label, the icon
image and its translated name, 10 s auto-dismiss, `/icons` link (`icons.equip`) that also
dismisses. Fed by `PracticePage` from `PracticeQuestion.unlockedIcon`, which also invalidates
`['my-icons']`. Names of the four practice icons live in `icons.practice-*`
(`ICON_IDS` in `src/lib/labels.ts`).

### Display on `ProfilePage`

The profile avatar shows `profile.selected_icon_url` when set, falling back to the
username's initials otherwise.

### Not yet built

- No display in lobby/podium: the backend doesn't send an icon field in game `Player`
  snapshots yet (unlike `title`).
- No unlock toast for the subscription icon: that path isn't tied to a game or a response
  carrying the icon, so only practice unlocks are announced.
