# Routing — Navigation and layouts

## Route structure (src/App.tsx)

```
BrowserRouter
├── AppLayout       (AuthProvider > GameProvider > Header)
│   ├── /           → HomePage
│   ├── /profile    → ProfilePage
│   ├── /terms      → TermsPage
│   ├── /terms-of-sale → TermsOfSalePage
│   ├── /progression → ProgressionPage
│   ├── /legal-notice → LegalNoticePage
│   └── /privacy-policy → PrivacyPolicyPage
└── GameLayout      (GameProvider)
    └── /game/:gameId? → GamePage   (gameId optional — see below)
```

## AppLayout (src/layouts/AppLayout.tsx)

Default layout for all non-game pages. Provides:

- `AuthProvider` (user session management)
- `GameProvider` (shared WebSocket client — used by HomePage to create games)
- Fixed `Header` at the top
- `Footer` — rendered only when `location.pathname === '/'`, hidden on all
  other routes (`/profile`, `/terms`, `/terms-of-sale`, `/progression`,
  `/legal-notice`, `/privacy-policy`). Discreet copyright notice + link to an
  external contact page (no dedicated contact page in Calc Rush) + links to
  `/terms-of-sale`, `/legal-notice` and `/privacy-policy`.

## GameLayout (src/layouts/GameLayout.tsx)

Minimal layout for the game page. Provides only `GameProvider`. No Header (space is managed by `GameView`).

## GamePage (src/pages/GamePage.tsx)

Orchestrates the three views based on `game.state`:

```typescript
switch (game.state) {
  case 'WAITING':
  case 'COUNTDOWN':   → LobbyView
  case 'IN_PROGRESS': → GameView
  case 'FINISHED':    → PodiumView
}
```

### Accessing the game page

Navigation to the game route **must** go through `navigate()` with a state:

```typescript
navigate(`/game/${gameId}`, { state: { playerName: string, token: string | null } }); // private lobby by code
navigate('/game', { state: { playerName: string, token: string | null } }); // quick game / resume
```

If `playerName` is absent from the state, `GamePage` redirects to `/`. `gameId` (from the URL) is
what `GamePage` uses to decide which `GameClient` method to call — see
[game-flow.md](game-flow.md#websocket-connection): present → `connectToLobby`, absent →
`connectToQuickGame`. The connect effect also depends on `location.key` so that navigating to the
same path again (e.g. "Rejouer" after a quick game, which reuses `/game` with no id) still
triggers a fresh connect — without it, React sees no changed dependency and skips the effect.

## Navigation between pages

- `HomePage` → "Créer un salon" → `createLobby()` (REST) → `navigate('/game/:id', { state })`
- `HomePage` → "Rejoindre un salon" → `navigate('/game/:code', { state })` (code typed by the user, not created via REST)
- `HomePage` → "Partie Rapide" → `navigate('/game', { state })` (no REST call, no id — the backend picks the game on `JOIN`)
- `PodiumView` → "Rejouer" → `navigate('/game', { state })` (same as quick game — always resumes/creates via `JOIN`, never reuses the finished game's id)
- `PodiumView` → back → `navigate('/')`
- `Header` → `← Home` link on all pages except `/`

## Adding a new page

1. Create `src/pages/MyPage.tsx`
2. Add the route in `App.tsx` under `AppLayout` (or `GameLayout` if it's a game page)
3. If the page requires authentication → check `isAuthenticated` and `isLoading` in the component
4. Add a link in `Header` if the page should be accessible from the main navigation
