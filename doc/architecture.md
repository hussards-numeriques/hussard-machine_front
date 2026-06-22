# Architecture — Calc Rush Frontend

## Tech stack

| Tool             | Version | Role                          |
| ---------------- | ------- | ----------------------------- |
| React            | 19      | UI                            |
| TypeScript       | ~5.9    | strict typing                 |
| Vite             | 7       | bundler / dev server          |
| Tailwind CSS     | 3       | utility styles                |
| React Router DOM | 7       | SPA routing                   |
| onnxruntime-web  | 1       | handwritten digit recognition |
| Vitest           | 4       | unit tests                    |
| Husky            | 9       | git hooks (pre-commit)        |

## Environment variables

| Variable            | Default value           | Usage                                |
| ------------------- | ----------------------- | ------------------------------------ |
| `VITE_API_URL`      | _(same origin)_         | Base URL for backend API + WebSocket |
| `VITE_FASTAUTH_URL` | `http://localhost:8000` | URL of the authentication service    |

In production, `VITE_API_URL` and `VITE_FASTAUTH_URL` point to the deployed backends.
In development without `.env`, REST/WS calls use the page origin (Vite proxy).

## Full file tree

```
calc-rush_front/
├── doc/                              # LLM documentation (this folder)
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
│   └── validate.sh                   # Runs lint + prettier + tsc + tests
├── src/
│   ├── main.tsx                      # React entry point (ReactDOM.createRoot)
│   ├── App.tsx                       # Root router (BrowserRouter + Routes)
│   ├── App.css / index.css           # Global styles
│   ├── types.ts                      # All shared types/interfaces
│   ├── test-setup.ts                 # Vitest configuration (jest-dom)
│   │
│   ├── layouts/
│   │   ├── AppLayout.tsx             # Standard layout: AuthProvider + GameProvider + Header + Outlet
│   │   └── GameLayout.tsx            # Game layout: GameProvider + Outlet (no Header)
│   │
│   ├── pages/
│   │   ├── HomePage.tsx              # Home: create/join a game
│   │   ├── GamePage.tsx              # Orchestrates the 3 views based on game.state
│   │   ├── ProfilePage.tsx           # Player profile, XP, history
│   │   ├── HowItWorksPage.tsx        # Help/FAQ shell: assembles GradeGuide + StreakGuide
│   │   ├── TermsPage.tsx             # Terms of service
│   │   ├── LegalNoticePage.tsx       # Legal notice (editor, hosting, IP)
│   │   └── PrivacyPolicyPage.tsx     # Privacy policy (GDPR, data collected)
│   │
│   ├── views/
│   │   ├── LobbyView.tsx             # Waiting lobby (WAITING / COUNTDOWN)
│   │   ├── GameView.tsx              # Game in progress (IN_PROGRESS)
│   │   └── PodiumView.tsx            # Final results (FINISHED)
│   │
│   ├── components/
│   │   ├── Button.tsx                # Reusable button (variant, size)
│   │   ├── Input.tsx                 # Reusable text field
│   │   ├── Header.tsx                # Fixed header (nav + auth)
│   │   ├── Footer.tsx                # Discreet footer (home page only): copyright + legal links
│   │   ├── AuthModal.tsx             # Login / register modal
│   │   ├── grade/
│   │   │   └── GradeGuide.tsx        # Explanatory card: XP, grades, levels (fetches /game/config)
│   │   └── AnswerInput/
│   │       ├── port.ts               # AnswerInputProps interface
│   │       ├── adapter.ts            # Selects KeyboardInput or HandwritingInput by device
│   │       ├── index.ts              # Exports the resolved component via the adapter
│   │       ├── KeyboardInput.tsx     # Keyboard input (desktop)
│   │       ├── HandwritingInput.tsx  # Handwriting input (touch)
│   │       ├── KeyboardInput.spec.tsx
│   │       ├── HandwritingInput.spec.tsx
│   │       └── adapter.spec.ts
│   │
│   ├── contexts/
│   │   ├── AuthContext.ts            # Auth context definition
│   │   ├── AuthProvider.tsx          # Auth provider (hydration, login, logout)
│   │   ├── useAuth.ts                # useAuth() hook
│   │   ├── GameContext.ts            # Game context definition
│   │   ├── GameProvider.tsx          # Game provider (client, state, error)
│   │   └── useGame.ts                # useGame() hook
│   │
│   ├── services/
│   │   ├── AuthClient.ts             # Auth HTTP client (login, register, refresh token)
│   │   ├── GameClient.ts             # Game WebSocket client (connect, submitAnswer, etc.)
│   │   ├── questionCategoryLabels.ts # Resolves question category labels
│   │   └── digit-recognition/
│   │       ├── port.ts               # DigitRecognitionPort interface
│   │       ├── index.ts              # Exports the singleton instance (OnnxMnistAdapter)
│   │       ├── OnnxMnistAdapter.ts   # onnxruntime-web MNIST implementation
│   │       ├── preprocessing.ts      # Pure canvas-pixels → 28×28 tensor helpers
│   │       └── preprocessing.spec.ts
│   │
│   └── lib/
│       ├── utils.ts                  # cn() utility (clsx + tailwind-merge)
│       └── useQuestionCategoryLabels.ts  # Hook to load labels from the API
│
├── index.html                        # Root HTML (SEO meta, Open Graph)
├── CLAUDE.md                         # LLM instructions (commands, conventions)
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.app.json
├── Dockerfile
├── docker-compose.yml
└── nginx.conf
```

## Main data flow

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
