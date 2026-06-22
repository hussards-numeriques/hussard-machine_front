# Streak Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher la série quotidienne (daily streak) d'un joueur connecté dans le header, via un composant `StreakBadge` (valeur + flamme évolutive par paliers + icône de quête du jour avec popover).

**Architecture:** Donnée externe `GET /me/streak` isolée derrière un port hexagonal (`src/services/streak/`, calqué sur `digit-recognition`). Logique domaine pure dans `status.ts`. État partagé via `StreakProvider`/`useStreak` (pattern `useAuth`). UI : factory `StreakFlame` (6 SVG par palier) + `DailyQuestIcon` + `StreakBadge` composite.

**Tech Stack:** React 19, TypeScript strict, Tailwind CSS, Vitest + @testing-library/react.

## Global Constraints

- TypeScript strict — aucun `any`. Interfaces pour les objets de données.
- Composants fonctionnels, **exports nommés** (jamais `export default` pour un composant).
- Aucun commentaire dans le code (sauf directives linter). Logique à expliquer → extraire dans une fonction/composant bien nommé.
- Styles : classes Tailwind uniquement, via `cn()` (`src/lib/utils.ts`) pour le conditionnel. Couleurs projet : `primary`, `primary-dark`, `primary-light`, `secondary`.
- Hooks custom (`useStreak`) throw si utilisés hors de leur provider.
- Tests : fichiers `*.spec.ts(x)` à côté du fichier testé.
- Chaque tâche se termine par un commit. Le hook pre-commit Husky lance `./scripts/validate.sh` (lint + prettier + tsc + tests) — il doit passer.
- URL API : `getApiUrl()` = `import.meta.env.VITE_API_URL ?? ''` (base API, **pas** FastAuth), sans `/` final.

---

### Task 1: Animations Tailwind

**Files:**
- Modify: `tailwind.config.js` (bloc `extend.animation` et `extend.keyframes`)

**Interfaces:**
- Produces: classes utilitaires `animate-flame-flicker`, `animate-glow-pulse`, `animate-particle-rise`, `animate-gold-shimmer`, `animate-quest-pulse` (consommées par les Tasks 5 et 6).

- [ ] **Step 1: Ajouter les animations et keyframes**

Dans `tailwind.config.js`, étendre les objets existants `animation` et `keyframes` (ne pas supprimer `pop-in`, `shake`, `combo-grow`, `bounce-short`). Ajouter dans `animation` :

```js
'flame-flicker': 'flame-flicker 1.2s ease-in-out infinite',
'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
'particle-rise': 'particle-rise 1.8s linear infinite',
'gold-shimmer': 'gold-shimmer 2.5s ease-in-out infinite',
'quest-pulse': 'quest-pulse 1s ease-in-out infinite',
```

Ajouter dans `keyframes` :

```js
'flame-flicker': {
  '0%, 100%': { transform: 'scale(1) translateY(0)' },
  '50%': { transform: 'scale(1.06) translateY(-0.5px)' },
},
'glow-pulse': {
  '0%, 100%': { opacity: '0.55' },
  '50%': { opacity: '0.9' },
},
'particle-rise': {
  '0%': { transform: 'translateY(0)', opacity: '0' },
  '20%': { opacity: '1' },
  '100%': { transform: 'translateY(-9px)', opacity: '0' },
},
'gold-shimmer': {
  '0%, 100%': { opacity: '0.75', filter: 'saturate(1)' },
  '50%': { opacity: '1', filter: 'saturate(1.4)' },
},
'quest-pulse': {
  '0%, 100%': { transform: 'scale(1)', opacity: '1' },
  '50%': { transform: 'scale(1.18)', opacity: '0.65' },
},
```

- [ ] **Step 2: Vérifier le build Tailwind / lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS (le fichier de config est valide, pas d'erreur).

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js
git commit -m "feat: add streak flame and quest animations to tailwind config"
```

---

### Task 2: Port streak + adapter HTTP

**Files:**
- Create: `src/services/streak/port.ts`
- Create: `src/services/streak/HttpStreakAdapter.ts`
- Create: `src/services/streak/index.ts`
- Test: `src/services/streak/HttpStreakAdapter.spec.ts`

**Interfaces:**
- Produces:
  - `interface StreakResponse { current_count: number; played_today: boolean; freeze_available_on: string | null; }`
  - `type AuthorizedFetch = (input: string, init?: RequestInit) => Promise<Response>`
  - `interface StreakRepository { fetchStreak(authorizedFetch: AuthorizedFetch): Promise<StreakResponse>; }`
  - `const streakRepository: StreakRepository` (instance résolue, export depuis `index.ts`)

- [ ] **Step 1: Écrire le contrat (`port.ts`)**

```ts
export interface StreakResponse {
  current_count: number;
  played_today: boolean;
  freeze_available_on: string | null;
}

export type AuthorizedFetch = (input: string, init?: RequestInit) => Promise<Response>;

export interface StreakRepository {
  fetchStreak(authorizedFetch: AuthorizedFetch): Promise<StreakResponse>;
}
```

- [ ] **Step 2: Écrire le test de l'adapter (échoue)**

`src/services/streak/HttpStreakAdapter.spec.ts` :

```ts
import { describe, expect, it, vi } from 'vitest';
import { HttpStreakAdapter } from './HttpStreakAdapter';
import type { StreakResponse } from './port';

const sample: StreakResponse = {
  current_count: 7,
  played_today: false,
  freeze_available_on: '2026-06-28',
};

describe('HttpStreakAdapter', () => {
  it('fetches /me/streak via the provided authorizedFetch and returns the parsed body', async () => {
    const authorizedFetch = vi.fn(async () => new Response(JSON.stringify(sample), { status: 200 }));
    const adapter = new HttpStreakAdapter();

    const result = await adapter.fetchStreak(authorizedFetch);

    expect(authorizedFetch).toHaveBeenCalledTimes(1);
    const calledUrl = authorizedFetch.mock.calls[0][0] as string;
    expect(calledUrl.endsWith('/me/streak')).toBe(true);
    expect(result).toEqual(sample);
  });

  it('throws when the response is not ok', async () => {
    const authorizedFetch = vi.fn(async () => new Response('nope', { status: 401 }));
    const adapter = new HttpStreakAdapter();

    await expect(adapter.fetchStreak(authorizedFetch)).rejects.toThrow();
  });
});
```

- [ ] **Step 3: Lancer le test (échoue)**

Run: `npm run test -- src/services/streak/HttpStreakAdapter.spec.ts`
Expected: FAIL (`HttpStreakAdapter` introuvable).

- [ ] **Step 4: Écrire l'adapter**

`src/services/streak/HttpStreakAdapter.ts` :

```ts
import type { AuthorizedFetch, StreakRepository, StreakResponse } from './port';

const getApiUrl = (): string => {
  const url = import.meta.env.VITE_API_URL ?? '';
  return typeof url === 'string' && url.endsWith('/') ? url.slice(0, -1) : (url as string);
};

export class HttpStreakAdapter implements StreakRepository {
  public async fetchStreak(authorizedFetch: AuthorizedFetch): Promise<StreakResponse> {
    const response = await authorizedFetch(`${getApiUrl()}/me/streak`);
    if (!response.ok) {
      throw new Error(`Failed to fetch streak (${response.status})`);
    }
    return (await response.json()) as StreakResponse;
  }
}
```

- [ ] **Step 5: Écrire `index.ts`**

```ts
import { HttpStreakAdapter } from './HttpStreakAdapter';
import type { StreakRepository } from './port';

export const streakRepository: StreakRepository = new HttpStreakAdapter();
export type { StreakRepository, StreakResponse, AuthorizedFetch } from './port';
```

- [ ] **Step 6: Lancer le test (passe)**

Run: `npm run test -- src/services/streak/HttpStreakAdapter.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add src/services/streak/port.ts src/services/streak/HttpStreakAdapter.ts src/services/streak/index.ts src/services/streak/HttpStreakAdapter.spec.ts
git commit -m "feat: add streak repository port and http adapter"
```

---

### Task 3: Logique domaine `deriveStreakStatus`

**Files:**
- Create: `src/services/streak/status.ts`
- Test: `src/services/streak/status.spec.ts`

**Interfaces:**
- Consumes: `StreakResponse` (Task 2).
- Produces:
  - `interface StreakStatus { count: number; isAlive: boolean; freezeReady: boolean; atRisk: boolean; lastChance: boolean; daysUntilFreeze: number | null; }`
  - `function deriveStreakStatus(streak: StreakResponse, now?: Date): StreakStatus`

- [ ] **Step 1: Écrire le test (échoue)**

`src/services/streak/status.spec.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { deriveStreakStatus } from './status';

const NOW = new Date('2026-06-22T10:00:00');

describe('deriveStreakStatus', () => {
  it('marks a played streak as secured (not at risk)', () => {
    const s = deriveStreakStatus(
      { current_count: 7, played_today: true, freeze_available_on: null },
      NOW
    );
    expect(s.isAlive).toBe(true);
    expect(s.atRisk).toBe(false);
    expect(s.lastChance).toBe(false);
    expect(s.freezeReady).toBe(true);
    expect(s.daysUntilFreeze).toBeNull();
  });

  it('flags soft risk when alive, not played today, freeze ready', () => {
    const s = deriveStreakStatus(
      { current_count: 5, played_today: false, freeze_available_on: null },
      NOW
    );
    expect(s.atRisk).toBe(true);
    expect(s.freezeReady).toBe(true);
    expect(s.lastChance).toBe(false);
  });

  it('flags last chance when alive, not played, freeze not ready, and counts days', () => {
    const s = deriveStreakStatus(
      { current_count: 5, played_today: false, freeze_available_on: '2026-06-28' },
      NOW
    );
    expect(s.lastChance).toBe(true);
    expect(s.freezeReady).toBe(false);
    expect(s.daysUntilFreeze).toBe(6);
  });

  it('treats count 0 as dead: not alive, not at risk', () => {
    const s = deriveStreakStatus(
      { current_count: 0, played_today: false, freeze_available_on: null },
      NOW
    );
    expect(s.isAlive).toBe(false);
    expect(s.atRisk).toBe(false);
    expect(s.lastChance).toBe(false);
  });

  it('clamps days to 0 when the freeze date is today or past', () => {
    const s = deriveStreakStatus(
      { current_count: 5, played_today: false, freeze_available_on: '2026-06-22' },
      NOW
    );
    expect(s.daysUntilFreeze).toBe(0);
  });
});
```

- [ ] **Step 2: Lancer le test (échoue)**

Run: `npm run test -- src/services/streak/status.spec.ts`
Expected: FAIL (`deriveStreakStatus` introuvable).

- [ ] **Step 3: Écrire l'implémentation**

`src/services/streak/status.ts` :

```ts
import type { StreakResponse } from './port';

export interface StreakStatus {
  count: number;
  isAlive: boolean;
  freezeReady: boolean;
  atRisk: boolean;
  lastChance: boolean;
  daysUntilFreeze: number | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const atMidnight = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const daysUntil = (dateStr: string, now: Date): number => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(year, month - 1, day).getTime();
  const diff = Math.round((target - atMidnight(now)) / MS_PER_DAY);
  return diff > 0 ? diff : 0;
};

export function deriveStreakStatus(streak: StreakResponse, now: Date = new Date()): StreakStatus {
  const isAlive = streak.current_count > 0;
  const freezeReady = streak.freeze_available_on === null;
  const atRisk = isAlive && !streak.played_today;
  const lastChance = atRisk && !freezeReady;
  const daysUntilFreeze =
    streak.freeze_available_on === null ? null : daysUntil(streak.freeze_available_on, now);

  return {
    count: streak.current_count,
    isAlive,
    freezeReady,
    atRisk,
    lastChance,
    daysUntilFreeze,
  };
}
```

- [ ] **Step 4: Lancer le test (passe)**

Run: `npm run test -- src/services/streak/status.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/services/streak/status.ts src/services/streak/status.spec.ts
git commit -m "feat: add deriveStreakStatus domain logic"
```

---

### Task 4: Context, provider et hook `useStreak`

**Files:**
- Create: `src/contexts/StreakContext.ts`
- Create: `src/contexts/StreakProvider.tsx`
- Create: `src/contexts/useStreak.ts`
- Modify: `src/layouts/AppLayout.tsx`
- Modify: `src/layouts/GameLayout.tsx`
- Test: `src/contexts/useStreak.spec.ts`

**Interfaces:**
- Consumes: `streakRepository` (Task 2), `useAuth()` → `{ client, isAuthenticated }`. `client.authorizedFetch(input, init)` correspond au type `AuthorizedFetch`.
- Produces: `interface StreakContextValue { streak: StreakResponse | null; isLoading: boolean; refresh: () => Promise<void>; }` ; `useStreak(): StreakContextValue` ; `<StreakProvider>`.

- [ ] **Step 1: Écrire le context (`StreakContext.ts`)**

```ts
import { createContext } from 'react';
import type { StreakResponse } from '../services/streak';

export interface StreakContextValue {
  streak: StreakResponse | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const StreakContext = createContext<StreakContextValue | null>(null);
```

- [ ] **Step 2: Écrire le hook (`useStreak.ts`)**

```ts
import { useContext } from 'react';
import { StreakContext, type StreakContextValue } from './StreakContext';

export const useStreak = (): StreakContextValue => {
  const ctx = useContext(StreakContext);
  if (!ctx) {
    throw new Error('useStreak must be used inside <StreakProvider>');
  }
  return ctx;
};
```

- [ ] **Step 3: Écrire le provider (`StreakProvider.tsx`)**

```tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import { streakRepository, type StreakResponse } from '../services/streak';
import { StreakContext, type StreakContextValue } from './StreakContext';

export const StreakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { client, isAuthenticated } = useAuth();
  const [streak, setStreak] = useState<StreakResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setStreak(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await streakRepository.fetchStreak((input, init) =>
        client.authorizedFetch(input, init)
      );
      setStreak(data);
    } catch {
      setStreak(null);
    } finally {
      setIsLoading(false);
    }
  }, [client, isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value: StreakContextValue = useMemo(
    () => ({ streak, isLoading, refresh }),
    [streak, isLoading, refresh]
  );

  return <StreakContext.Provider value={value}>{children}</StreakContext.Provider>;
};
```

- [ ] **Step 4: Monter le provider dans les layouts**

Dans `src/layouts/AppLayout.tsx`, importer `StreakProvider` et l'insérer entre `AuthProvider` et `GameProvider` :

```tsx
import { StreakProvider } from '../contexts/StreakProvider';
```

```tsx
    <AuthProvider>
      <StreakProvider>
        <GameProvider>
          <div className="min-h-screen bg-slate-50">
            <Header />
            <Outlet />
            {location.pathname === '/' && <Footer />}
          </div>
        </GameProvider>
      </StreakProvider>
    </AuthProvider>
```

Dans `src/layouts/GameLayout.tsx`, idem :

```tsx
import { StreakProvider } from '../contexts/StreakProvider';
```

```tsx
    <AuthProvider>
      <StreakProvider>
        <GameProvider>
          <div className="min-h-screen bg-slate-50">
            <Outlet />
          </div>
        </GameProvider>
      </StreakProvider>
    </AuthProvider>
```

- [ ] **Step 5: Écrire le test du hook (`useStreak.spec.ts`)**

```ts
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useStreak } from './useStreak';

describe('useStreak', () => {
  it('throws when used outside a StreakProvider', () => {
    expect(() => renderHook(() => useStreak())).toThrow(
      'useStreak must be used inside <StreakProvider>'
    );
  });
});
```

- [ ] **Step 6: Lancer les tests + typecheck**

Run: `npm run test -- src/contexts/useStreak.spec.ts && npx tsc --noEmit`
Expected: PASS (1 test) et aucune erreur de type.

- [ ] **Step 7: Commit**

```bash
git add src/contexts/StreakContext.ts src/contexts/StreakProvider.tsx src/contexts/useStreak.ts src/contexts/useStreak.spec.ts src/layouts/AppLayout.tsx src/layouts/GameLayout.tsx
git commit -m "feat: add streak context, provider and useStreak hook"
```

---

### Task 5: Factory de flammes `StreakFlame`

**Files:**
- Create: `src/components/streak/StreakFlame/flamePath.ts`
- Create: `src/components/streak/StreakFlame/parts.tsx`
- Create: `src/components/streak/StreakFlame/tiers.ts`
- Create: `src/components/streak/StreakFlame/EmberFlame.tsx`
- Create: `src/components/streak/StreakFlame/OrangeFlame.tsx`
- Create: `src/components/streak/StreakFlame/AmberFlame.tsx`
- Create: `src/components/streak/StreakFlame/BlueFlame.tsx`
- Create: `src/components/streak/StreakFlame/VioletFlame.tsx`
- Create: `src/components/streak/StreakFlame/GoldFlame.tsx`
- Create: `src/components/streak/StreakFlame/index.tsx`
- Test: `src/components/streak/StreakFlame/index.spec.tsx`

**Interfaces:**
- Consumes: `cn` (`src/lib/utils.ts`), classes d'animation (Task 1).
- Produces:
  - `interface FlameProps { size?: number; animated?: boolean; muted?: boolean; }`
  - `interface StreakTier { id: 'ember' | 'orange' | 'amber' | 'blue' | 'violet' | 'gold'; min: number; Flame: React.ComponentType<FlameProps>; valueColorClass: string; }`
  - `function getStreakTier(count: number): StreakTier`
  - `<StreakFlame count={number} size? animated? muted? />` (rend un `<svg data-tier="<id>">`)

> Note: l'esthétique fine (formes, dégradés) sera ajustée visuellement à l'implémentation. Le code ci-dessous est complet et fonctionnel ; la structure (silhouette partagée + effets escaladés par palier) est ce qui compte.

- [ ] **Step 1: Silhouette partagée (`flamePath.ts`)**

```ts
export const FLAME_PATH =
  'M12 2C9 6.5 7 8.5 7 12.5a5 5 0 0 0 10 0c0-1.9-.8-3.4-1.9-4.7.25 1.5-.6 2.6-1.6 2.6 0-3.2-.9-5.9-1.5-8.4z';
```

- [ ] **Step 2: Parts réutilisables (`parts.tsx`)**

```tsx
import React from 'react';
import { cn } from '../../../lib/utils';
import { FLAME_PATH } from './flamePath';

export const FlameSilhouette: React.FC<{ gradientId: string; animated?: boolean }> = ({
  gradientId,
  animated,
}) => (
  <path
    d={FLAME_PATH}
    fill={`url(#${gradientId})`}
    className={cn('origin-bottom', animated && 'animate-flame-flicker')}
  />
);

export const Glow: React.FC<{ gradientId: string; animated?: boolean }> = ({
  gradientId,
  animated,
}) => (
  <circle cx="12" cy="14" r="11" fill={`url(#${gradientId})`} className={cn(animated && 'animate-glow-pulse')} />
);

const PARTICLES = [
  { cx: 9, cy: 9, r: 0.8, delay: '0s' },
  { cx: 15, cy: 7.5, r: 0.9, delay: '0.6s' },
  { cx: 12, cy: 5.5, r: 0.7, delay: '1.1s' },
];

export const Particles: React.FC<{ color: string; animated?: boolean }> = ({ color, animated }) => (
  <g fill={color}>
    {PARTICLES.map((p) => (
      <circle
        key={`${p.cx}-${p.cy}`}
        cx={p.cx}
        cy={p.cy}
        r={p.r}
        className={cn(animated && 'animate-particle-rise')}
        style={animated ? { animationDelay: p.delay } : undefined}
      />
    ))}
  </g>
);

export const Crown: React.FC<{ animated?: boolean }> = ({ animated }) => (
  <path
    d="M8 4.2l1.6 2L12 3.8l2.4 2.4 1.6-2-.7 3.4H8.7L8 4.2z"
    fill="#fcd34d"
    stroke="#f59e0b"
    strokeWidth="0.4"
    className={cn(animated && 'animate-gold-shimmer')}
  />
);

export const FlameSvg: React.FC<{
  tier: string;
  size: number;
  children: React.ReactNode;
}> = ({ tier, size, children }) => (
  <svg
    data-tier={tier}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    {children}
  </svg>
);
```

- [ ] **Step 3: Les 6 flammes**

`EmberFlame.tsx` (1–2 j, + état `muted` pour count 0) :

```tsx
import React, { useId } from 'react';
import { FlameSilhouette, FlameSvg } from './parts';
import type { FlameProps } from './tiers';

export const EmberFlame: React.FC<FlameProps> = ({ size = 22, animated = true, muted = false }) => {
  const id = useId();
  const gradId = `ember-${id}`;
  return (
    <FlameSvg tier="ember" size={size}>
      <defs>
        <linearGradient id={gradId} x1="12" y1="3" x2="12" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={muted ? '#cbd5e1' : '#fdba74'} />
          <stop offset="1" stopColor={muted ? '#94a3b8' : '#f97316'} />
        </linearGradient>
      </defs>
      <g opacity={muted ? 0.5 : 0.9}>
        <FlameSilhouette gradientId={gradId} animated={animated && !muted} />
      </g>
    </FlameSvg>
  );
};
```

`OrangeFlame.tsx` (3–6 j) :

```tsx
import React, { useId } from 'react';
import { FlameSilhouette, FlameSvg } from './parts';
import type { FlameProps } from './tiers';

export const OrangeFlame: React.FC<FlameProps> = ({ size = 22, animated = true }) => {
  const id = useId();
  const gradId = `orange-${id}`;
  return (
    <FlameSvg tier="orange" size={size}>
      <defs>
        <linearGradient id={gradId} x1="12" y1="3" x2="12" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="0.6" stopColor="#f97316" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <FlameSilhouette gradientId={gradId} animated={animated} />
    </FlameSvg>
  );
};
```

`AmberFlame.tsx` (7–13 j, + glow doux) :

```tsx
import React, { useId } from 'react';
import { FlameSilhouette, FlameSvg, Glow } from './parts';
import type { FlameProps } from './tiers';

export const AmberFlame: React.FC<FlameProps> = ({ size = 22, animated = true }) => {
  const id = useId();
  const gradId = `amber-${id}`;
  const glowId = `amber-glow-${id}`;
  return (
    <FlameSvg tier="amber" size={size}>
      <defs>
        <linearGradient id={gradId} x1="12" y1="3" x2="12" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.6" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <radialGradient id={glowId} cx="0.5" cy="0.6" r="0.6">
          <stop offset="0" stopColor="#fbbf24" stopOpacity="0.7" />
          <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Glow gradientId={glowId} animated={animated} />
      <FlameSilhouette gradientId={gradId} animated={animated} />
    </FlameSvg>
  );
};
```

`BlueFlame.tsx` (14–29 j, + glow + particules) :

```tsx
import React, { useId } from 'react';
import { FlameSilhouette, FlameSvg, Glow, Particles } from './parts';
import type { FlameProps } from './tiers';

export const BlueFlame: React.FC<FlameProps> = ({ size = 22, animated = true }) => {
  const id = useId();
  const gradId = `blue-${id}`;
  const glowId = `blue-glow-${id}`;
  return (
    <FlameSvg tier="blue" size={size}>
      <defs>
        <linearGradient id={gradId} x1="12" y1="3" x2="12" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#bae6fd" />
          <stop offset="0.55" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <radialGradient id={glowId} cx="0.5" cy="0.6" r="0.6">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0.75" />
          <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Glow gradientId={glowId} animated={animated} />
      <FlameSilhouette gradientId={gradId} animated={animated} />
      <Particles color="#e0f2fe" animated={animated} />
    </FlameSvg>
  );
};
```

`VioletFlame.tsx` (30–59 j, + grande aura + particules) :

```tsx
import React, { useId } from 'react';
import { FlameSilhouette, FlameSvg, Glow, Particles } from './parts';
import type { FlameProps } from './tiers';

export const VioletFlame: React.FC<FlameProps> = ({ size = 22, animated = true }) => {
  const id = useId();
  const gradId = `violet-${id}`;
  const glowId = `violet-glow-${id}`;
  return (
    <FlameSvg tier="violet" size={size}>
      <defs>
        <linearGradient id={gradId} x1="12" y1="3" x2="12" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e9d5ff" />
          <stop offset="0.5" stopColor="#a855f7" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <radialGradient id={glowId} cx="0.5" cy="0.55" r="0.65">
          <stop offset="0" stopColor="#c084fc" stopOpacity="0.85" />
          <stop offset="1" stopColor="#c084fc" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Glow gradientId={glowId} animated={animated} />
      <FlameSilhouette gradientId={gradId} animated={animated} />
      <Particles color="#f3e8ff" animated={animated} />
    </FlameSvg>
  );
};
```

`GoldFlame.tsx` (60+ j, + aura + particules + couronne + scintillement) :

```tsx
import React, { useId } from 'react';
import { Crown, FlameSilhouette, FlameSvg, Glow, Particles } from './parts';
import type { FlameProps } from './tiers';

export const GoldFlame: React.FC<FlameProps> = ({ size = 22, animated = true }) => {
  const id = useId();
  const gradId = `gold-${id}`;
  const glowId = `gold-glow-${id}`;
  return (
    <FlameSvg tier="gold" size={size}>
      <defs>
        <linearGradient id={gradId} x1="12" y1="3" x2="12" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fef9c3" />
          <stop offset="0.5" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <radialGradient id={glowId} cx="0.5" cy="0.55" r="0.7">
          <stop offset="0" stopColor="#fde047" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fde047" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Glow gradientId={glowId} animated={animated} />
      <FlameSilhouette gradientId={gradId} animated={animated} />
      <Particles color="#fef08a" animated={animated} />
      <Crown animated={animated} />
    </FlameSvg>
  );
};
```

- [ ] **Step 4: Table des paliers (`tiers.ts`)**

```ts
import type { ComponentType } from 'react';
import { AmberFlame } from './AmberFlame';
import { BlueFlame } from './BlueFlame';
import { EmberFlame } from './EmberFlame';
import { GoldFlame } from './GoldFlame';
import { OrangeFlame } from './OrangeFlame';
import { VioletFlame } from './VioletFlame';

export interface FlameProps {
  size?: number;
  animated?: boolean;
  muted?: boolean;
}

export type TierId = 'ember' | 'orange' | 'amber' | 'blue' | 'violet' | 'gold';

export interface StreakTier {
  id: TierId;
  min: number;
  Flame: ComponentType<FlameProps>;
  valueColorClass: string;
}

export const STREAK_TIERS: StreakTier[] = [
  { id: 'gold', min: 60, Flame: GoldFlame, valueColorClass: 'text-amber-500' },
  { id: 'violet', min: 30, Flame: VioletFlame, valueColorClass: 'text-violet-600' },
  { id: 'blue', min: 14, Flame: BlueFlame, valueColorClass: 'text-sky-500' },
  { id: 'amber', min: 7, Flame: AmberFlame, valueColorClass: 'text-amber-500' },
  { id: 'orange', min: 3, Flame: OrangeFlame, valueColorClass: 'text-orange-500' },
  { id: 'ember', min: 1, Flame: EmberFlame, valueColorClass: 'text-orange-400' },
];

export function getStreakTier(count: number): StreakTier {
  return STREAK_TIERS.find((tier) => count >= tier.min) ?? STREAK_TIERS[STREAK_TIERS.length - 1];
}
```

- [ ] **Step 5: La factory (`index.tsx`)**

```tsx
import React from 'react';
import { getStreakTier, type FlameProps } from './tiers';

interface StreakFlameProps extends FlameProps {
  count: number;
}

export const StreakFlame: React.FC<StreakFlameProps> = ({ count, ...rest }) => {
  const { Flame } = getStreakTier(count);
  return <Flame {...rest} />;
};

export { getStreakTier, STREAK_TIERS } from './tiers';
export type { FlameProps, StreakTier, TierId } from './tiers';
```

- [ ] **Step 6: Écrire le test de la factory (`index.spec.tsx`)**

```tsx
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StreakFlame, getStreakTier } from './index';

describe('getStreakTier', () => {
  it.each([
    [0, 'ember'],
    [1, 'ember'],
    [2, 'ember'],
    [3, 'orange'],
    [6, 'orange'],
    [7, 'amber'],
    [13, 'amber'],
    [14, 'blue'],
    [29, 'blue'],
    [30, 'violet'],
    [59, 'violet'],
    [60, 'gold'],
    [365, 'gold'],
  ])('count %i maps to tier %s', (count, expected) => {
    expect(getStreakTier(count).id).toBe(expected);
  });
});

describe('StreakFlame', () => {
  it('renders the svg of the tier matching the count', () => {
    const { container } = render(<StreakFlame count={14} animated={false} />);
    expect(container.querySelector('[data-tier="blue"]')).not.toBeNull();
  });
});
```

- [ ] **Step 7: Lancer le test (passe) + typecheck**

Run: `npm run test -- src/components/streak/StreakFlame/index.spec.tsx && npx tsc --noEmit`
Expected: PASS (14 cas + 1 test), aucune erreur de type.

- [ ] **Step 8: Commit**

```bash
git add src/components/streak/StreakFlame
git commit -m "feat: add evolving streak flame icons and tier factory"
```

---

### Task 6: Icône de quête `DailyQuestIcon`

**Files:**
- Create: `src/components/streak/DailyQuestIcon.tsx`
- Test: `src/components/streak/DailyQuestIcon.spec.tsx`

**Interfaces:**
- Consumes: `cn` (`src/lib/utils.ts`), `animate-quest-pulse` (Task 1).
- Produces:
  - `type QuestState = 'secured' | 'soft-risk' | 'last-chance' | 'neutral'`
  - `<DailyQuestIcon state={QuestState} size? animated? />` (rend un `<svg data-quest="<state>">`)

- [ ] **Step 1: Écrire le test (échoue)**

`src/components/streak/DailyQuestIcon.spec.tsx` :

```tsx
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DailyQuestIcon } from './DailyQuestIcon';

describe('DailyQuestIcon', () => {
  it('renders the secured (check) state', () => {
    const { container } = render(<DailyQuestIcon state="secured" />);
    expect(container.querySelector('[data-quest="secured"]')).not.toBeNull();
  });

  it('applies the pulse animation only in last-chance state when animated', () => {
    const { container } = render(<DailyQuestIcon state="last-chance" />);
    expect(container.querySelector('.animate-quest-pulse')).not.toBeNull();
  });

  it('does not animate when animated is false', () => {
    const { container } = render(<DailyQuestIcon state="last-chance" animated={false} />);
    expect(container.querySelector('.animate-quest-pulse')).toBeNull();
  });
});
```

- [ ] **Step 2: Lancer le test (échoue)**

Run: `npm run test -- src/components/streak/DailyQuestIcon.spec.tsx`
Expected: FAIL (`DailyQuestIcon` introuvable).

- [ ] **Step 3: Écrire l'implémentation**

`src/components/streak/DailyQuestIcon.tsx` :

```tsx
import React from 'react';
import { cn } from '../../lib/utils';

export type QuestState = 'secured' | 'soft-risk' | 'last-chance' | 'neutral';

interface DailyQuestIconProps {
  state: QuestState;
  size?: number;
  animated?: boolean;
}

const COLORS: Record<QuestState, string> = {
  secured: '#16a34a',
  'soft-risk': '#f59e0b',
  'last-chance': '#e11d48',
  neutral: '#cbd5e1',
};

export const DailyQuestIcon: React.FC<DailyQuestIconProps> = ({
  state,
  size = 18,
  animated = true,
}) => {
  const color = COLORS[state];
  return (
    <svg
      data-quest={state}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn(state === 'last-chance' && animated && 'animate-quest-pulse')}
    >
      {state === 'secured' ? (
        <>
          <circle cx="12" cy="12" r="10" fill={color} />
          <path
            d="M7.5 12.3l3 3 6-6.2"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.2" />
          <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2.2" />
          <circle cx="12" cy="12" r="1.4" fill={color} />
        </>
      )}
    </svg>
  );
};
```

- [ ] **Step 4: Lancer le test (passe)**

Run: `npm run test -- src/components/streak/DailyQuestIcon.spec.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/streak/DailyQuestIcon.tsx src/components/streak/DailyQuestIcon.spec.tsx
git commit -m "feat: add daily quest icon with state variants"
```

---

### Task 7: Composant `StreakBadge` et intégration au header

**Files:**
- Create: `src/components/streak/StreakBadge.tsx`
- Modify: `src/components/Header.tsx`
- Test: `src/components/streak/StreakBadge.spec.tsx`

**Interfaces:**
- Consumes: `useAuth()` (`isAuthenticated`), `useStreak()` (`streak`), `deriveStreakStatus` (Task 3), `getStreakTier` + `StreakFlame` (Task 5), `DailyQuestIcon` + `QuestState` (Task 6), `cn`.
- Produces: `<StreakBadge />` (rend `null` si non authentifié ou `streak === null`).

- [ ] **Step 1: Écrire le test (échoue)**

`src/components/streak/StreakBadge.spec.tsx`. Le test fournit directement les contextes (pas les vrais providers) pour contrôler l'état sans réseau :

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthContext, type AuthContextValue } from '../../contexts/AuthContext';
import { StreakContext, type StreakContextValue } from '../../contexts/StreakContext';
import type { StreakResponse } from '../../services/streak';
import { StreakBadge } from './StreakBadge';

const authValue = (isAuthenticated: boolean): AuthContextValue => ({
  client: {} as AuthContextValue['client'],
  user: isAuthenticated ? ({ username: 'Tim' } as AuthContextValue['user']) : null,
  isAuthenticated,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

const renderBadge = (isAuthenticated: boolean, streak: StreakResponse | null) => {
  const streakValue: StreakContextValue = { streak, isLoading: false, refresh: async () => {} };
  return render(
    <AuthContext.Provider value={authValue(isAuthenticated)}>
      <StreakContext.Provider value={streakValue}>
        <StreakBadge />
      </StreakContext.Provider>
    </AuthContext.Provider>
  );
};

describe('StreakBadge', () => {
  it('renders nothing when not authenticated', () => {
    const { container } = renderBadge(false, {
      current_count: 5,
      played_today: true,
      freeze_available_on: null,
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when streak data is missing', () => {
    const { container } = renderBadge(true, null);
    expect(container.firstChild).toBeNull();
  });

  it('shows the count and a secured quest icon when played today', () => {
    const { container } = renderBadge(true, {
      current_count: 12,
      played_today: true,
      freeze_available_on: null,
    });
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(container.querySelector('[data-quest="secured"]')).not.toBeNull();
  });

  it('hides the count and mutes the flame at count 0', () => {
    const { container } = renderBadge(true, {
      current_count: 0,
      played_today: false,
      freeze_available_on: null,
    });
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(container.querySelector('[data-quest="neutral"]')).not.toBeNull();
  });

  it('opens a soft-risk popover on click without a day counter', () => {
    const { container } = renderBadge(true, {
      current_count: 8,
      played_today: false,
      freeze_available_on: null,
    });
    expect(container.querySelector('[data-quest="soft-risk"]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /quête/i }));
    expect(screen.getByText(/sécuriser ta série/i)).toBeInTheDocument();
  });

  it('opens a last-chance popover with the days until the safety net returns', () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    const pad = (n: number) => String(n).padStart(2, '0');
    const iso = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}`;
    renderBadge(true, { current_count: 8, played_today: false, freeze_available_on: iso });
    fireEvent.click(screen.getByRole('button', { name: /quête/i }));
    expect(screen.getByText(/dans 3 jours/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Lancer le test (échoue)**

Run: `npm run test -- src/components/streak/StreakBadge.spec.tsx`
Expected: FAIL (`StreakBadge` introuvable).

- [ ] **Step 3: Écrire l'implémentation**

`src/components/streak/StreakBadge.tsx` :

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { useStreak } from '../../contexts/useStreak';
import { deriveStreakStatus } from '../../services/streak/status';
import { cn } from '../../lib/utils';
import { StreakFlame, getStreakTier } from './StreakFlame';
import { DailyQuestIcon, type QuestState } from './DailyQuestIcon';

const dayLabel = (days: number): string => (days <= 1 ? `${days} jour` : `${days} jours`);

export const StreakBadge: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { streak } = useStreak();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  if (!isAuthenticated || !streak) {
    return null;
  }

  const status = deriveStreakStatus(streak);
  const tier = getStreakTier(status.count);

  const questState: QuestState = streak.played_today
    ? 'secured'
    : status.lastChance
      ? 'last-chance'
      : status.atRisk
        ? 'soft-risk'
        : 'neutral';

  const clickable = questState === 'soft-risk' || questState === 'last-chance';

  const popoverMessage =
    questState === 'last-chance'
      ? `Dernière chance ! Joue aujourd'hui ou tu perds ta série. ❄ Filet de sécurité de retour dans ${dayLabel(status.daysUntilFreeze ?? 0)}.`
      : 'Joue aujourd’hui pour sécuriser ta série !';

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow border border-slate-200">
        {status.isAlive && (
          <span className={cn('text-sm font-black tabular-nums', tier.valueColorClass)}>
            {status.count}
          </span>
        )}
        <StreakFlame count={status.count} muted={!status.isAlive} />
        {clickable ? (
          <button
            type="button"
            aria-label="Quête quotidienne"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center"
          >
            <DailyQuestIcon state={questState} />
          </button>
        ) : (
          <DailyQuestIcon state={questState} />
        )}
      </div>

      {open && clickable && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border-2 border-slate-100 p-3 text-left text-xs font-semibold text-slate-600 leading-relaxed">
          {popoverMessage}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Lancer le test (passe)**

Run: `npm run test -- src/components/streak/StreakBadge.spec.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Intégrer dans le header**

Dans `src/components/Header.tsx`, importer le badge :

```tsx
import { StreakBadge } from './streak/StreakBadge';
```

Puis, dans la branche `isAuthenticated && user`, placer `<StreakBadge />` à **gauche** du bouton username en les groupant dans un conteneur flex. Remplacer le `<button …>{user.username}</button>` (et son menu) par un wrapper :

```tsx
            <div className="flex items-center gap-2">
              <StreakBadge />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu((s) => !s)}
                  className="text-sm font-bold text-slate-700 bg-white px-4 py-2 rounded-full shadow border border-slate-200 hover:border-primary-dark transition-colors"
                >
                  {user.username}
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border-2 border-slate-100 overflow-hidden">
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Mon profil
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 border-t border-slate-100"
                    >
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            </div>
```

> Note : le `<div className="pointer-events-auto relative">` parent enveloppe désormais ce groupe ; garder `pointer-events-auto`. Le menu user reste positionné par son propre `relative` interne.

- [ ] **Step 6: Validation complète**

Run: `./scripts/validate.sh`
Expected: lint OK, prettier OK, tsc OK, tous les tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/streak/StreakBadge.tsx src/components/streak/StreakBadge.spec.tsx src/components/Header.tsx
git commit -m "feat: show streak badge in header for authenticated players"
```

---

### Task 8: Documentation et préparation de version

**Files:**
- Create: `doc/streak.md`
- Modify: `doc/index.md`
- Modify: `CHANGELOG.md`
- Modify: `package.json` (via `npm version`)

**Interfaces:** aucune (étape de release).

- [ ] **Step 1: Documenter la feature (`doc/streak.md`)**

Créer une page concise décrivant : la route `GET /me/streak` et `StreakResponse` ; le port `src/services/streak/` (port/adapter, `deriveStreakStatus`) ; le `StreakProvider`/`useStreak` ; les composants `StreakBadge`, `StreakFlame` (paliers + factory) et `DailyQuestIcon` ; le réemploi futur de `StreakFlame` pour les joueurs en partie. Suivre le ton des autres fichiers de `doc/`.

- [ ] **Step 2: Référencer la page dans `doc/index.md`**

Ajouter une entrée dans le « Feature index » :

```markdown
### [streak.md](streak.md)

Série quotidienne : route `/me/streak`, port hex`services/streak` (`deriveStreakStatus`), `StreakProvider`/`useStreak`, et composants `StreakBadge` / `StreakFlame` (flamme évolutive par paliers) / `DailyQuestIcon`.
→ Read when: modifying the streak display, the tier thresholds, or reusing the flame icon elsewhere.
```

- [ ] **Step 3: Entrée CHANGELOG**

Ajouter en tête de `CHANGELOG.md` une entrée pour la version à venir décrivant l'ajout du badge de série dans le header (flamme évolutive par paliers, icône de quête quotidienne avec popover de risque, intégration `/me/streak`).

- [ ] **Step 4: Bump de version**

Run: `npm version minor`
Expected: `package.json` passe en `0.6.0`, commit de version créé par npm.

> Note : nouvelle feature → `minor`. Pas de modif SEO (`manifest.json`/`sitemap.xml` inchangés, single-page).

- [ ] **Step 5: Commit de la doc et du changelog**

```bash
git add doc/streak.md doc/index.md CHANGELOG.md
git commit -m "docs: document streak feature and changelog for 0.6.0"
```

- [ ] **Step 6: Validation finale**

Run: `./scripts/validate.sh`
Expected: tout PASS.

---

## Notes d'exécution

- L'ordre des tâches respecte les dépendances : 1 (anim) → 2 (port) → 3 (domaine) → 4 (contexte) → 5 (flammes) → 6 (icône quête) → 7 (badge + header) → 8 (release).
- Tâches 5 et 6 sont indépendantes l'une de l'autre (toutes deux requièrent la Task 1) ; la Task 7 requiert 3, 5, 6.
- L'esthétique des flammes (formes, dégradés, intensité) est fonctionnelle dès le départ mais pensée pour être affinée visuellement — c'est le seul endroit où une itération design post-implémentation est attendue.
