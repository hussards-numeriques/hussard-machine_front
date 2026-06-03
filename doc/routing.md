# Routing — Navigation et layouts

## Structure des routes (src/App.tsx)

```
BrowserRouter
├── AppLayout       (AuthProvider > GameProvider > Header)
│   ├── /           → HomePage
│   ├── /profile    → ProfilePage
│   ├── /terms      → TermsPage
│   └── /how-it-works → HowItWorksPage
└── GameLayout      (GameProvider)
    └── /game/:gameId → GamePage
```

## AppLayout (src/layouts/AppLayout.tsx)

Layout par défaut pour toutes les pages hors jeu. Fournit :

- `AuthProvider` (gestion de la session utilisateur)
- `GameProvider` (client WebSocket partagé — utilisé par HomePage pour créer des parties)
- `Header` fixe en haut

## GameLayout (src/layouts/GameLayout.tsx)

Layout minimal pour la page de jeu. Fournit uniquement `GameProvider`. Pas de Header (l'espace est géré par `GameView`).

## GamePage (src/pages/GamePage.tsx)

Orchestre les trois vues selon `game.state` :

```typescript
switch (game.state) {
  case 'WAITING':
  case 'COUNTDOWN':  → LobbyView
  case 'IN_PROGRESS': → GameView
  case 'FINISHED':   → PodiumView
}
```

### Accès à la page jeu

La navigation vers `/game/:gameId` **doit** passer par `navigate()` avec un state :

```typescript
navigate(`/game/${gameId}`, {
  state: { playerName: string, token: string | null },
});
```

Si `playerName` est absent du state, `GamePage` redirige vers `/`.

## Navigation entre pages

- `HomePage` → crée une partie → `navigate('/game/:id', { state })`
- `PodiumView` → rejouer → crée une quickGame → `navigate('/game/:id', { state })`
- `PodiumView` → retour → `navigate('/')`
- `Header` → lien `← Accueil` sur toutes les pages sauf `/`

## Ajouter une nouvelle page

1. Créer `src/pages/MaPage.tsx`
2. Ajouter la route dans `App.tsx` sous `AppLayout` (ou `GameLayout` si page de jeu)
3. Si la page nécessite l'authentification → vérifier `isAuthenticated` et `isLoading` dans le composant
4. Ajouter un lien dans `Header` si la page doit être accessible depuis la navigation principale
