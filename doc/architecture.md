# Architecture — Calc Rush Frontend

## Stack technique

| Outil            | Version | Rôle                                  |
| ---------------- | ------- | ------------------------------------- |
| React            | 19      | UI                                    |
| TypeScript       | ~5.9    | typage strict                         |
| Vite             | 7       | bundler / dev server                  |
| Tailwind CSS     | 3       | styles utilitaires                    |
| React Router DOM | 7       | routing SPA                           |
| TensorFlow.js    | 4       | reconnaissance de chiffres manuscrits |
| Vitest           | 4       | tests unitaires                       |
| Husky            | 9       | git hooks (pre-commit)                |

## Variables d'environnement

| Variable            | Valeur par défaut       | Usage                                    |
| ------------------- | ----------------------- | ---------------------------------------- |
| `VITE_API_URL`      | _(même origine)_        | URL de base de l'API backend + WebSocket |
| `VITE_FASTAUTH_URL` | `http://localhost:8000` | URL du service d'authentification        |

En production, `VITE_API_URL` et `VITE_FASTAUTH_URL` pointent vers les backends déployés.
En développement sans `.env`, les appels REST/WS utilisent l'origine de la page (proxy Vite).

## Arborescence complète

```
calc-rush_front/
├── doc/                              # Documentation LLM (ce dossier)
│   ├── index.md
│   ├── architecture.md
│   ├── auth.md
│   ├── game-flow.md
│   ├── game-views.md
│   ├── answer-input.md
│   ├── player-profile.md
│   ├── routing.md
│   └── conventions.md
├── public/
│   ├── icon.png
│   ├── manifest.json
│   ├── robots.txt
│   └── sitemap.xml
├── scripts/
│   └── validate.sh                   # Lance lint + prettier + tsc + tests
├── src/
│   ├── main.tsx                      # Point d'entrée React (ReactDOM.createRoot)
│   ├── App.tsx                       # Routeur racine (BrowserRouter + Routes)
│   ├── App.css / index.css           # Styles globaux
│   ├── types.ts                      # Tous les types/interfaces partagés
│   ├── test-setup.ts                 # Configuration Vitest (jest-dom)
│   │
│   ├── layouts/
│   │   ├── AppLayout.tsx             # Layout standard : AuthProvider + GameProvider + Header + Outlet
│   │   └── GameLayout.tsx            # Layout jeu : GameProvider + Outlet (sans Header)
│   │
│   ├── pages/
│   │   ├── HomePage.tsx              # Accueil : créer/rejoindre une partie
│   │   ├── GamePage.tsx              # Orchestre les 3 vues selon game.state
│   │   ├── ProfilePage.tsx           # Profil joueur, XP, historique
│   │   ├── HowItWorksPage.tsx        # Page explicative du système de grades
│   │   └── TermsPage.tsx             # Mentions légales / CGU
│   │
│   ├── views/
│   │   ├── LobbyView.tsx             # Salon d'attente (WAITING / COUNTDOWN)
│   │   ├── GameView.tsx              # Partie en cours (IN_PROGRESS)
│   │   └── PodiumView.tsx            # Résultats finaux (FINISHED)
│   │
│   ├── components/
│   │   ├── Button.tsx                # Bouton réutilisable (variant, size)
│   │   ├── Input.tsx                 # Champ texte réutilisable
│   │   ├── Header.tsx                # En-tête fixe (nav + auth)
│   │   ├── AuthModal.tsx             # Modale login / inscription
│   │   └── AnswerInput/
│   │       ├── port.ts               # Interface AnswerInputProps
│   │       ├── adapter.ts            # Sélection KeyboardInput ou HandwritingInput selon device
│   │       ├── index.ts              # Export du composant résolu via l'adapter
│   │       ├── KeyboardInput.tsx     # Saisie clavier (desktop)
│   │       ├── HandwritingInput.tsx  # Saisie manuscrite (tactile)
│   │       ├── KeyboardInput.spec.tsx
│   │       ├── HandwritingInput.spec.tsx
│   │       └── adapter.spec.ts
│   │
│   ├── contexts/
│   │   ├── AuthContext.ts            # Définition du contexte Auth
│   │   ├── AuthProvider.tsx          # Fournisseur Auth (hydratation, login, logout)
│   │   ├── useAuth.ts                # Hook useAuth()
│   │   ├── GameContext.ts            # Définition du contexte Game
│   │   ├── GameProvider.tsx          # Fournisseur Game (client, état, erreur)
│   │   └── useGame.ts                # Hook useGame()
│   │
│   ├── services/
│   │   ├── AuthClient.ts             # Client HTTP auth (login, register, refresh token)
│   │   ├── GameClient.ts             # Client WebSocket jeu (connect, submitAnswer, etc.)
│   │   ├── questionCategoryLabels.ts # Résolution des labels de catégories de questions
│   │   └── digit-recognition/
│   │       ├── port.ts               # Interface DigitRecognitionPort
│   │       ├── index.ts              # Export de l'instance (TfjsMnistAdapter)
│   │       ├── TfjsMnistAdapter.ts   # Implémentation TensorFlow.js MNIST
│   │       ├── segmentation.ts       # Algorithme de segmentation des traits en chiffres
│   │       └── segmentation.spec.ts
│   │
│   └── lib/
│       ├── utils.ts                  # Utilitaire cn() (clsx + tailwind-merge)
│       └── useQuestionCategoryLabels.ts  # Hook pour charger les labels depuis l'API
│
├── index.html                        # HTML racine (meta SEO, Open Graph)
├── CLAUDE.md                         # Instructions pour LLM (commandes, conventions)
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.app.json
├── Dockerfile
├── docker-compose.yml
└── nginx.conf
```

## Flux de données principal

```
main.tsx
  └── App.tsx (BrowserRouter)
        ├── AppLayout (AuthProvider > GameProvider > Header)
        │     ├── HomePage      → client.createLobby() / createQuickGame() → navigate(/game/:id)
        │     ├── ProfilePage   → authClient.authorizedFetch(/me/details)
        │     └── ...
        └── GameLayout (GameProvider)
              └── GamePage      → client.connect(gameId) via WebSocket
                    ├── LobbyView    (game.state = WAITING | COUNTDOWN)
                    ├── GameView     (game.state = IN_PROGRESS)
                    └── PodiumView   (game.state = FINISHED)
```
