# Auth sans flash + session glissante 7 jours — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supprimer le flash « invité → connecté » au chargement (rendu optimiste depuis un cache de profil) et rendre la session glissante sur 7 jours (refresh proactif au montage, rotation backend existante), sans jamais déconnecter sur une simple erreur réseau.

**Architecture:** Front uniquement. `AuthClient` (src/services/AuthClient.ts) gagne un cache de profil localStorage validé par zod, une méthode publique `refreshSession()`, et un `tryRefresh` qui n'efface les tokens que sur 401 confirmé (avec récupération de la course de rotation multi-onglets). `AuthProvider` (src/contexts/AuthProvider.tsx) initialise son state de manière synchrone depuis le cache et hydrate en arrière-plan via refresh proactif + `fetchMe`.

**Tech Stack:** React 19, TypeScript strict, zod, Vitest + @testing-library/react (+ jest-dom), jsdom (localStorage disponible dans les tests).

**Spec:** `doc/specs/2026-07-06-auth-optimistic-sliding-session-design.md`

## Global Constraints

- Pas de commentaires dans le code (règle projet), pas de `any`.
- Clés localStorage : `hm_access_token`, `hm_refresh_token`, nouvelle clé `hm_auth_user`.
- Tout payload entrant est validé par zod dans la couche service.
- Validation complète avant chaque commit : le hook pre-commit lance lint + prettier + tests (`./scripts/validate.sh`). `npx tsc -b` à lancer manuellement.
- Imports vitest explicites (`import { describe, expect, it, vi, beforeEach } from 'vitest'`), pas de globals implicites dans le code des specs.

---

### Task 1: Cache de profil dans AuthClient

**Files:**

- Modify: `src/services/AuthClient.ts`
- Test: `src/services/AuthClient.spec.ts`

**Interfaces:**

- Consumes: `authUserSchema`, `AuthUser`, clés localStorage existantes.
- Produces: `AuthClient.getCachedUser(): AuthUser | null`, `AuthClient.setCachedUser(user: AuthUser): void`, `clearTokens()` efface aussi le cache, `fetchMe()` écrit le cache après succès. Task 3 dépend de `getCachedUser`.

- [ ] **Step 1: Écrire les tests qui échouent**

Ajouter à la fin de `src/services/AuthClient.spec.ts` (et compléter la ligne d'import existante avec `beforeEach`, `vi`, `AuthClient`) :

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthClient, parseOAuthFragment } from './AuthClient';
```

```typescript
const sampleUser = {
  id: 'u1',
  email: 'alice@example.com',
  username: 'alice',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('AuthClient profile cache', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('returns null when nothing is cached', () => {
    const client = new AuthClient();

    expect(client.getCachedUser()).toBeNull();
  });

  it('round-trips a cached user', () => {
    const client = new AuthClient();

    client.setCachedUser(sampleUser);

    expect(client.getCachedUser()).toEqual(sampleUser);
  });

  it('returns null when the cached payload is not valid JSON', () => {
    localStorage.setItem('hm_auth_user', '{not json');
    const client = new AuthClient();

    expect(client.getCachedUser()).toBeNull();
  });

  it('returns null when the cached payload fails schema validation', () => {
    localStorage.setItem('hm_auth_user', JSON.stringify({ id: 42 }));
    const client = new AuthClient();

    expect(client.getCachedUser()).toBeNull();
  });

  it('clearTokens removes the cached user', () => {
    const client = new AuthClient();
    client.setCachedUser(sampleUser);

    client.clearTokens();

    expect(client.getCachedUser()).toBeNull();
  });

  it('fetchMe caches the returned user', async () => {
    localStorage.setItem('hm_access_token', 'access');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(sampleUser), { status: 200 }))
    );
    const client = new AuthClient();

    await client.fetchMe();

    expect(client.getCachedUser()).toEqual(sampleUser);
  });
});
```

- [ ] **Step 2: Vérifier que les tests échouent**

Run: `npx vitest run src/services/AuthClient.spec.ts`
Expected: FAIL — `getCachedUser is not a function` (les 3 tests `parseOAuthFragment` existants restent verts).

- [ ] **Step 3: Implémenter le cache**

Dans `src/services/AuthClient.ts` :

Ajouter la constante à côté des deux existantes (après la ligne `const REFRESH_TOKEN_KEY = 'hm_refresh_token';`) :

```typescript
const CACHED_USER_KEY = 'hm_auth_user';
```

Ajouter les deux méthodes dans la classe, après `setTokens` :

```typescript
  public getCachedUser(): AuthUser | null {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = authUserSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  public setCachedUser(user: AuthUser): void {
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
  }
```

Remplacer `clearTokens` :

```typescript
  public clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(CACHED_USER_KEY);
  }
```

Remplacer la fin de `fetchMe` pour écrire le cache :

```typescript
  public async fetchMe(): Promise<AuthUser> {
    const response = await this.authorizedFetch(`${this.baseUrl}/api/v1/auth/me`);
    if (!response.ok) {
      throw new AuthError(response.status, await extractMessage(response));
    }
    const user = authUserSchema.parse(await response.json());
    this.setCachedUser(user);
    return user;
  }
```

- [ ] **Step 4: Vérifier que les tests passent**

Run: `npx vitest run src/services/AuthClient.spec.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Type check + commit**

```bash
npx tsc -b
git add src/services/AuthClient.ts src/services/AuthClient.spec.ts
git commit -m "feat: cache the authenticated user profile in localStorage"
```

(le hook pre-commit relance lint + prettier + tests complets)

---

### Task 2: refreshSession publique, downgrade sur 401 seulement, course multi-onglets

**Files:**

- Modify: `src/services/AuthClient.ts` (méthode `tryRefresh`, nouvelle méthode `refreshSession`, nouvelle méthode privée `recoverFromLostRefreshRace`)
- Test: `src/services/AuthClient.spec.ts`

**Interfaces:**

- Consumes: `tryRefresh` privé existant (déduplication `refreshInFlight` conservée), `TokenResponse`.
- Produces: `AuthClient.refreshSession(): Promise<TokenResponse | null>` — retourne les nouveaux tokens, ou `null` (pas de refresh token / échec). N'efface les tokens **que** sur 401 sans rotation concurrente. Task 3 dépend de `refreshSession`.

- [ ] **Step 1: Écrire les tests qui échouent**

Ajouter à la fin de `src/services/AuthClient.spec.ts` :

```typescript
const seedTokens = () => {
  localStorage.setItem('hm_access_token', 'old-access');
  localStorage.setItem('hm_refresh_token', 'old-refresh');
};

const tokenBody = JSON.stringify({
  access_token: 'new-access',
  refresh_token: 'new-refresh',
  token_type: 'bearer',
});

describe('AuthClient.refreshSession', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('rotates tokens on success', async () => {
    seedTokens();
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(tokenBody, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const client = new AuthClient();

    const result = await client.refreshSession();

    expect(result?.access_token).toBe('new-access');
    expect(client.getAccessToken()).toBe('new-access');
    expect(client.getRefreshToken()).toBe('new-refresh');
    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get('Authorization')).toBe('Bearer old-refresh');
  });

  it('returns null without touching the network when no refresh token exists', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const client = new AuthClient();

    const result = await client.refreshSession();

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clears tokens on a 401 when no other tab rotated them', async () => {
    seedTokens();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 401 }))
    );
    const client = new AuthClient();

    const result = await client.refreshSession();

    expect(result).toBeNull();
    expect(client.getAccessToken()).toBeNull();
    expect(client.getRefreshToken()).toBeNull();
  });

  it('keeps tokens on a non-401 server error', async () => {
    seedTokens();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('boom', { status: 503 }))
    );
    const client = new AuthClient();

    const result = await client.refreshSession();

    expect(result).toBeNull();
    expect(client.getAccessToken()).toBe('old-access');
    expect(client.getRefreshToken()).toBe('old-refresh');
  });

  it('keeps tokens on a network error', async () => {
    seedTokens();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('offline');
      })
    );
    const client = new AuthClient();

    const result = await client.refreshSession();

    expect(result).toBeNull();
    expect(client.getAccessToken()).toBe('old-access');
    expect(client.getRefreshToken()).toBe('old-refresh');
  });

  it('adopts tokens written by another tab when losing the rotation race', async () => {
    seedTokens();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        localStorage.setItem('hm_access_token', 'winner-access');
        localStorage.setItem('hm_refresh_token', 'winner-refresh');
        return new Response('rotated elsewhere', { status: 401 });
      })
    );
    const client = new AuthClient();

    const result = await client.refreshSession();

    expect(result).toEqual({
      access_token: 'winner-access',
      refresh_token: 'winner-refresh',
      token_type: 'bearer',
    });
    expect(client.getAccessToken()).toBe('winner-access');
    expect(client.getRefreshToken()).toBe('winner-refresh');
  });
});
```

- [ ] **Step 2: Vérifier que les tests échouent**

Run: `npx vitest run src/services/AuthClient.spec.ts`
Expected: FAIL — `refreshSession is not a function`.

- [ ] **Step 3: Implémenter**

Dans `src/services/AuthClient.ts`, ajouter juste au-dessus de la déclaration `private refreshInFlight` :

```typescript
  public async refreshSession(): Promise<TokenResponse | null> {
    return this.tryRefresh();
  }
```

Dans `tryRefresh`, remplacer le bloc :

```typescript
if (!response.ok) {
  this.clearTokens();
  return null;
}
```

par :

```typescript
if (!response.ok) {
  if (response.status === 401) {
    return this.recoverFromLostRefreshRace(refreshToken);
  }
  return null;
}
```

Ajouter la méthode privée après `tryRefresh` :

```typescript
  private recoverFromLostRefreshRace(usedRefreshToken: string): TokenResponse | null {
    const storedRefreshToken = this.getRefreshToken();
    const storedAccessToken = this.getAccessToken();
    if (storedRefreshToken && storedAccessToken && storedRefreshToken !== usedRefreshToken) {
      return {
        access_token: storedAccessToken,
        refresh_token: storedRefreshToken,
        token_type: 'bearer',
      };
    }
    this.clearTokens();
    return null;
  }
```

- [ ] **Step 4: Vérifier que les tests passent**

Run: `npx vitest run src/services/AuthClient.spec.ts`
Expected: PASS (15 tests).

- [ ] **Step 5: Type check + commit**

```bash
npx tsc -b
git add src/services/AuthClient.ts src/services/AuthClient.spec.ts
git commit -m "feat: expose refreshSession and survive multi-tab refresh rotation races"
```

---

### Task 3: AuthProvider — rendu optimiste + hydratation proactive

**Files:**

- Modify: `src/contexts/AuthProvider.tsx`
- Create (test): `src/contexts/AuthProvider.spec.tsx`

**Interfaces:**

- Consumes: `AuthClient.getRefreshToken()`, `getCachedUser()` (Task 1), `refreshSession()` (Task 2), `fetchMe()` (met en cache, Task 1), `AuthError`.
- Produces: aucun changement d'interface — `AuthContextValue` est inchangé. Changement de comportement : `user` est non-nul dès le premier rendu si session en cache ; `isLoading` n'est vrai que si des tokens existent sans cache.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `src/contexts/AuthProvider.spec.tsx` :

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

const sampleUser = {
  id: 'u1',
  email: 'alice@example.com',
  username: 'alice',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const Probe = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <span>loading</span>;
  }
  return <span>{user ? user.username : 'guest'}</span>;
};

const seedSession = () => {
  localStorage.setItem('hm_access_token', 'old-access');
  localStorage.setItem('hm_refresh_token', 'old-refresh');
  localStorage.setItem('hm_auth_user', JSON.stringify(sampleUser));
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

const renderProbe = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );

describe('AuthProvider hydration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('renders the cached user on first paint while the network is pending', () => {
    seedSession();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => {}))
    );

    renderProbe();

    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('renders guest immediately without any network call when no session exists', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderProbe();

    expect(screen.getByText('guest')).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).not.toHaveBeenCalled());
  });

  it('refreshes the session then fetches the fresh profile on mount', async () => {
    seedSession();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/api/v1/auth/refresh')) {
        return jsonResponse({
          access_token: 'new-access',
          refresh_token: 'new-refresh',
          token_type: 'bearer',
        });
      }
      if (url.endsWith('/api/v1/auth/me')) {
        return jsonResponse({ ...sampleUser, username: 'alice-updated' });
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderProbe();

    await waitFor(() => expect(screen.getByText('alice-updated')).toBeInTheDocument());
    expect(localStorage.getItem('hm_refresh_token')).toBe('new-refresh');
    expect(localStorage.getItem('hm_access_token')).toBe('new-access');
  });

  it('downgrades to guest and clears storage when fastauth rejects the session', async () => {
    seedSession();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ detail: 'nope' }, 401))
    );

    renderProbe();

    await waitFor(() => expect(screen.getByText('guest')).toBeInTheDocument());
    expect(localStorage.getItem('hm_access_token')).toBeNull();
    expect(localStorage.getItem('hm_refresh_token')).toBeNull();
    expect(localStorage.getItem('hm_auth_user')).toBeNull();
  });

  it('keeps the optimistic session when the network is down', async () => {
    seedSession();
    const fetchMock = vi.fn(async () => {
      throw new TypeError('offline');
    });
    vi.stubGlobal('fetch', fetchMock);

    renderProbe();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(localStorage.getItem('hm_refresh_token')).toBe('old-refresh');
    expect(localStorage.getItem('hm_auth_user')).not.toBeNull();
  });
});
```

Note sur le test « network is down » : le 1er appel fetch est le refresh (échec réseau → `tryRefresh` retourne `null` sans effacer), le 2e est `/auth/me` (échec réseau → `fetchMe` propage un `TypeError`, pas un `AuthError`) — l'état optimiste doit survivre.

- [ ] **Step 2: Vérifier que les tests échouent**

Run: `npx vitest run src/contexts/AuthProvider.spec.tsx`
Expected: FAIL — au minimum « renders the cached user on first paint » (le provider actuel démarre à `user = null`) et « refreshes the session » (pas d'appel `/refresh` au montage).

- [ ] **Step 3: Réécrire AuthProvider**

Remplacer intégralement le contenu de `src/contexts/AuthProvider.tsx` :

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  AuthClient,
  AuthError,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
} from '../services/AuthClient';
import { AuthContext, type AuthContextValue } from './AuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const client = useMemo(() => new AuthClient(), []);
  const [user, setUser] = useState<AuthUser | null>(() =>
    client.getRefreshToken() ? client.getCachedUser() : null
  );
  const [isLoading, setIsLoading] = useState<boolean>(
    () => client.getRefreshToken() !== null && client.getCachedUser() === null
  );

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      if (!client.getRefreshToken()) {
        setIsLoading(false);
        return;
      }
      try {
        await client.refreshSession();
        const me = await client.fetchMe();
        if (!cancelled) {
          setUser(me);
        }
      } catch (error) {
        if (error instanceof AuthError && error.status === 401) {
          client.clearTokens();
          if (!cancelled) {
            setUser(null);
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [client]);

  const login = async (payload: LoginPayload) => {
    await client.login(payload);
    const me = await client.fetchMe();
    setUser(me);
  };

  const register = async (payload: RegisterPayload) => {
    await client.register(payload);
    const me = await client.fetchMe();
    setUser(me);
  };

  const logout = async () => {
    await client.logout();
    setUser(null);
  };

  const reloadUser = async () => {
    const me = await client.fetchMe();
    setUser(me);
  };

  const value: AuthContextValue = {
    client,
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
    reloadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

Points de vigilance :

- L'ancrage de session passe de l'access token au **refresh token** (`getRefreshToken()`) : c'est lui qui définit « une session existe », l'access token n'étant qu'un dérivé de 30 min.
- Le scénario « refresh 401 » fonctionne par composition : `refreshSession()` efface les tokens (Task 2), puis `fetchMe()` part sans token → 401 → `AuthError` → le catch confirme le downgrade et nettoie le state React.

- [ ] **Step 4: Vérifier que les tests passent**

Run: `npx vitest run src/contexts/AuthProvider.spec.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Suite complète + type check + commit**

```bash
npx tsc -b
npm run test
git add src/contexts/AuthProvider.tsx src/contexts/AuthProvider.spec.tsx
git commit -m "feat: optimistic auth rendering and proactive sliding-session refresh"
```

Expected: suite complète verte (les specs existantes de Header/ProfilePage/HomePage ne testent pas le timing d'hydratation ; si l'une casse, vérifier qu'elle n'assertait pas `user = null` au premier rendu avec des tokens seedés).

---

### Task 4: Documentation + CHANGELOG

**Files:**

- Modify: `doc/auth.md`
- Modify: `CHANGELOG.md`

**Interfaces:**

- Consumes: comportements livrés par les Tasks 1–3.
- Produces: doc à jour ; entrée de changelog prête pour le `npm version minor` du push.

- [ ] **Step 1: Mettre à jour doc/auth.md**

Quatre retouches :

1. Table « Token storage » — ajouter la ligne :

```markdown
| `hm_auth_user` | Cached `AuthUser` profile (zod-validated on read) |
```

2. Table « Public methods » — ajouter :

```markdown
| `refreshSession()` | `GET /api/v1/auth/refresh` | Proactive refresh (token rotation). Returns new tokens or `null`. |
| `getCachedUser()` | — | Reads the cached profile from localStorage (`null` if absent or invalid). |
| `setCachedUser(user)` | — | Writes the profile cache. Called automatically by `fetchMe()`. |
```

et corriger la ligne `clearTokens()` : « Removes the three localStorage keys (tokens + cached profile). »

3. Section « Refresh token » — remplacer le point 4 par :

```markdown
4. If refresh fails with a 401 → `clearTokens()` — unless another tab already rotated the tokens (the refresh token in localStorage changed), in which case the other tab's tokens are adopted. Non-401 failures (network, 5xx) never clear tokens.
```

4. Section « Hydration on startup » — remplacer par :

```markdown
### Hydration on startup

`AuthProvider` renders optimistically, then validates in the background:

1. Synchronous init: if a refresh token exists, `user` starts from the cached profile (`hm_auth_user`) — the UI renders logged-in on first paint, no guest flash. `isLoading` is only `true` when tokens exist without a cached profile.
2. On mount: `refreshSession()` (rotation → the 7-day expiry slides forward on every visit) then `fetchMe()` to refresh `user` and the cache.
3. Downgrade to guest **only** on a confirmed 401 (`clearTokens()` + `user = null`). Network errors keep the optimistic state.
```

- [ ] **Step 2: Ajouter l'entrée CHANGELOG**

En tête de `CHANGELOG.md` (sous le titre, au-dessus de `## [0.10.0]`), en suivant le format existant :

```markdown
## [Unreleased]

### Changed

- No more guest flash on load for logged-in players: `AuthProvider` now renders optimistically from a cached profile (`hm_auth_user`, zod-validated) and validates the session in the background.
- Sliding 7-day session: the app proactively calls `/auth/refresh` on every load (token rotation resets the 7-day expiry), so regular players stay logged in indefinitely.
- Logout-on-error is now reserved for confirmed 401s: network failures or fastauth downtime no longer clear tokens. A refresh that loses a multi-tab rotation race adopts the winning tab's tokens instead of logging everyone out.
```

(le `[Unreleased]` sera renommé en version lors du `npm version minor` avant push)

- [ ] **Step 3: Commit**

```bash
git add doc/auth.md CHANGELOG.md
git commit -m "docs: document optimistic auth hydration and sliding session"
```

---

## Vérification finale (après les 4 tasks)

- [ ] `./scripts/validate.sh` — tout vert.
- [ ] Vérification manuelle (skill superpowers:verification-before-completion / verify) : lancer `npm run dev` avec fastauth up, se connecter, recharger la page → l'UI doit rendre l'état connecté immédiatement (pas de flash), et `hm_refresh_token` doit changer à chaque rechargement (rotation visible dans les DevTools → Application → Local Storage).
