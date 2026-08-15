# Player icons — backend contract

Players can now unlock and select a profile icon. Three new/changed REST routes.

## `GET /icons` — public catalog

No auth. Cached (`Cache-Control: public, max-age=604800`).

```json
[
  {
    "id": "subscriber-star",
    "name": "Étoile Abonné",
    "rarity": "GOLD",
    "url": "http://localhost:8000/static/icons/subscriber-star.svg"
  }
]
```

`rarity` is one of `BRONZE`/`SILVER`/`GOLD`/`DIAMOND` — same open-ended contract as title
rarities (`doc/quests-titles.md`), treat unknown values gracefully.

## `GET /me/icons` — Bearer required

```json
{
  "selected_icon_id": "subscriber-star",
  "icons": [
    {
      "id": "subscriber-star",
      "name": "Étoile Abonné",
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

Only one path is wired: taking a subscription (Stripe checkout or a redeem code) unlocks
the `subscriber-star` icon automatically, asynchronously (no WS event, same
fetch-and-diff caveat as title unlocks — see `doc/quests-titles.md`'s unlock-toast
section if icon-unlock notifications are wanted later). No easter eggs or season pass
exist yet — the backend has the extension point but nothing else grants an icon today.
