# CLAUDE.md - calc-rush_front

## Project Overview

Frontend application for Calc Rush - a multiplayer mental math training application.
Built with React 19, TypeScript, Vite, and Tailwind CSS.

## Commands

- Install dependencies: `npm install`
- Run dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Format check: `npx prettier --check .`
- Type check: `npx tsc --noEmit`
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
npx tsc --noEmit
npm run test
```

Or use the validation script: `./scripts/validate.sh`
