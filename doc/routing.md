# Routing — Navigation and layouts

## Route structure (src/App.tsx)

```
BrowserRouter
├── AppLayout       (AuthProvider > GameProvider > Header)
│   ├── /           → HomePage
│   ├── /profile    → ProfilePage
│   ├── /terms      → TermsPage
│   ├── /terms-of-sale → TermsOfSalePage
│   ├── /how-it-works → HowItWorksPage
│   ├── /legal-notice → LegalNoticePage
│   └── /privacy-policy → PrivacyPolicyPage
└── GameLayout      (GameProvider)
    └── /game/:gameId → GamePage
```

## AppLayout (src/layouts/AppLayout.tsx)

Default layout for all non-game pages. Provides:

- `AuthProvider` (user session management)
- `GameProvider` (shared WebSocket client — used by HomePage to create games)
- Fixed `Header` at the top
- `Footer` — rendered only when `location.pathname === '/'`, hidden on all
  other routes (`/profile`, `/terms`, `/terms-of-sale`, `/how-it-works`,
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

Navigation to `/game/:gameId` **must** go through `navigate()` with a state:

```typescript
navigate(`/game/${gameId}`, {
  state: { playerName: string, token: string | null },
});
```

If `playerName` is absent from the state, `GamePage` redirects to `/`.

## Navigation between pages

- `HomePage` → creates a game → `navigate('/game/:id', { state })`
- `PodiumView` → play again → creates a quickGame → `navigate('/game/:id', { state })`
- `PodiumView` → back → `navigate('/')`
- `Header` → `← Home` link on all pages except `/`

## Adding a new page

1. Create `src/pages/MyPage.tsx`
2. Add the route in `App.tsx` under `AppLayout` (or `GameLayout` if it's a game page)
3. If the page requires authentication → check `isAuthenticated` and `isLoading` in the component
4. Add a link in `Header` if the page should be accessible from the main navigation
