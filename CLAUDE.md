# CLAUDE.md - calc-rush_front

## Discover the project

@doc/index.md

## Project Overview

Frontend application for Calc Rush - a multiplayer mental math training application.
Built with React 19, TypeScript, Vite, and Tailwind CSS.

## Commands

- Install dependencies: `npm install`
- Run dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Format check: `npx prettier --check .`
- Type check: `npx tsc -b`
- Test: `npm run test`
- All checks: `./scripts/validate.sh`

## Architecture

- `src/views/` - Page-level components (HomeView, LobbyView, GameView, PodiumView)
- `src/components/` - Reusable UI components (Button, Input)
- `src/services/` - API/WebSocket client (GameClient)
- `src/lib/` - Utility functions
- `src/types.ts` - TypeScript type definitions

## Code Style Rules

### Comments

- Code must be self-documenting. No comments except linter directives.
- If you need to explain code, extract it into a well-named function or component instead.

### TypeScript

- Strict TypeScript - no `any` types.
- Prefer functional components with hooks.
- Use proper TypeScript types for all props and state.
- Model mutually exclusive situations as discriminated unions so that impossible states are unrepresentable. Reserve optional/nullable fields for data the backend can genuinely omit in every state.
- Type domain enums (grades, levels, WS message types) as string-literal unions; use `Record<Grade, string>` lookups so the compiler flags missing entries.
- Import hooks directly: `import { useState } from 'react'`.

### State & data (React)

- Derive values during render whenever they can be computed from existing props/state (sorted lists, current question, flags). Reserve `useState` for state the user directly mutates (inputs, toggles, UI mode).
- Reserve `useEffect` for synchronizing with external systems: WebSocket, timers, browser APIs. Data fetching goes through TanStack Query, not hand-written effects.
- Fetch REST data with TanStack Query (`useQuery`/`useMutation`): it owns caching, deduplication, retries, and loading/error states. Keep the real-time game flow on `GameClient` + `GameContext` (WebSocket push, not request/response).
- Validate every payload entering the app (HTTP responses, WS messages) with a zod schema inside the service layer; components consume already-validated types.

### Components

- One component per screen state; the parent orchestrates with a switch or early returns (see `GamePage`). Extract a sub-component as soon as JSX would need a nested ternary.
- Views and pages receive display-ready data via props/hooks; network calls and business rules live in `services/` and `lib/`.
- Extract pure logic (XP/grade math, formatting, sorting) into `lib/` functions with unit tests.
- Declare domain constants (grade labels, level labels, grade styles) in a single shared module imported everywhere.

### Services & boundaries

- Resolve the API base URL in one shared module; every endpoint is defined in a `services/` module. Components call services, never `fetch` directly or build URLs.
- Type WS messages as a discriminated union on `type`, validated with zod at the boundary in `GameClient`.
- Every effect that opens a resource (WebSocket, interval, subscription) returns a cleanup that closes it.
- Surface errors through returned state (query error, context error field); keep the console for the dev server only.

## SEO

SEO is configured via static files, no library needed:

- `index.html` - Meta tags (description, author, theme-color), canonical URL, Open Graph, Twitter Cards
- `public/robots.txt` - Crawler directives + sitemap reference
- `public/sitemap.xml` - Single-page sitemap
- `public/manifest.json` - PWA manifest (name, icons, theme)
- `public/icon.png` - Favicon and app icon

Production URL: `https://www.calc-rush.fr/`

When modifying SEO tags, update all occurrences (index.html, sitemap.xml, manifest.json).

## Validation

All checks must pass before committing:

```bash
npm run lint
npx prettier --check .
npx tsc -b
npm run test
```

Or use the validation script: `./scripts/validate.sh`

## Before push

- update public/manifest.json
- update public/sitemap.xml
- add an version commit with (npm version patch|minor|major)
- add an entry in CHANGELOG.md
- check if doc need to be update using doc/index.md
