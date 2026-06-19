# Conventions — Code patterns and rules

## TypeScript

- Strict mode enabled — no `any` (except the two places already annotated `eslint-disable` in `GameClient`)
- Interfaces preferred over `type` for data objects
- Shared types in `src/types.ts`, service-local types in the service file
- Component props are declared as a local `interface` in the component file

## React components

- Functional only, with hooks
- Named exports (no `export default` for components)
- Custom hooks (`useGame`, `useAuth`, etc.) throw an error if used outside their Provider

## Port / adapter pattern

Used for abstractions with multiple possible implementations:

```
feature/
├── port.ts     ← TypeScript interface (contract)
├── adapter.ts  ← implementation selection logic
├── index.ts    ← exports the resolved instance/component
├── ImplA.tsx
└── ImplB.tsx
```

Existing examples: `AnswerInput/`, `services/digit-recognition/`

Use whenever there are multiple implementations or the implementation may change (device, feature flag, test).

## Styles (Tailwind CSS)

- Utility classes only, no custom CSS except `App.css` and `index.css`
- `cn()` utility (clsx + tailwind-merge) for conditional classes:
  ```typescript
  import { cn } from '../lib/utils';
  cn('base-class', condition && 'conditional-class', className);
  ```
- Project colors defined in `tailwind.config.js`: `primary`, `primary-dark`, `primary-light`, `secondary`
- No Tailwind UI components or third-party CSS library, no shared `Card`/page-layout component — each page repeats the utility classes below

### Page card patterns

Two recurring patterns for full-page content, picked by content length:

- **Long content** (sections, multiple paragraphs) — e.g. `HowItWorksPage`, `LegalNoticePage`, `PrivacyPolicyPage`:
  - Wrapper: `min-h-screen p-4 pt-20 max-w-2xl mx-auto space-y-6`
  - Card: `bg-white rounded-3xl shadow-lg border-2 border-slate-100 p-8 space-y-6`
  - Sections: `space-y-3`, left-aligned
- **Short content** (single message, form, error/loading state) — e.g. `TermsPage`, `ProfilePage` error/loading states:
  - Wrapper: `min-h-screen flex items-center justify-center p-4`
  - Card: `max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 text-center space-y-4`

Shared typography across both patterns:

- Title: `text-3xl font-black text-primary-dark`
- Section heading: `text-xl font-black text-slate-700`
- Body text: `text-slate-600 text-sm leading-relaxed`
- Back link: `text-sm font-bold text-slate-400 hover:text-primary transition-colors`

## Comments

No comments in code. If logic needs explanation, extract it into a well-named function or component.

Tolerated exception: linter directives (`// eslint-disable-next-line`).

## Tests

Framework: Vitest + @testing-library/react

- Test files: `*.spec.ts` or `*.spec.tsx` next to the tested file
- `src/test-setup.ts` imports `@testing-library/jest-dom` for DOM matchers
- `src/test.spec.ts`: global smoke test
- Component tests with media queries use `vi.stubGlobal` to mock `matchMedia`

## Pre-commit validation

```bash
npm run lint         # ESLint
npx prettier --check .
npx tsc --noEmit     # type checking
npm run test         # Vitest
```

Or in one command: `./scripts/validate.sh`

The Husky pre-commit hook runs this validation automatically.

## Environment variables

All env variables must be prefixed with `VITE_` to be accessible in code via `import.meta.env.VITE_XXX`.

## Dev commands

```bash
npm install          # install dependencies
npm run dev          # development server (Vite)
npm run build        # production build
npm run test         # tests in run mode (non-interactive)
```
