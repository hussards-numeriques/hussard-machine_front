# Auth — Authentication

Authentication is optional: a player can play without an account. An account allows saving XP and game history.

## AuthClient (src/services/AuthClient.ts)

HTTP client for the FastAuth service (`VITE_FASTAUTH_URL`).

### Token storage

Tokens are stored in `localStorage`:

| Key                | Content                                           |
| ------------------ | ------------------------------------------------- |
| `hm_access_token`  | Access JWT (short lifetime)                       |
| `hm_refresh_token` | Refresh JWT                                       |
| `hm_auth_user`     | Cached `AuthUser` profile (zod-validated on read) |

### Public methods

| Method                        | Endpoint                     | Description                                                                             |
| ----------------------------- | ---------------------------- | --------------------------------------------------------------------------------------- |
| `login(payload)`              | `POST /api/v1/auth/login`    | Form URL-encoded. Stores tokens.                                                        |
| `register(payload)`           | `POST /api/v1/auth/register` | JSON. Stores tokens.                                                                    |
| `logout()`                    | `POST /api/v1/auth/logout`   | Clears tokens. Network errors ignored.                                                  |
| `fetchMe()`                   | `GET /api/v1/auth/me`        | Returns `AuthUser`.                                                                     |
| `authorizedFetch(url, init?)` | —                            | `fetch` with `Authorization: Bearer <token>` header. Automatic retry after 401 refresh. |
| `getAccessToken()`            | —                            | Reads from localStorage.                                                                |
| `clearTokens()`               | —                            | Removes the three localStorage keys (tokens + cached profile).                          |
| `refreshSession()`            | `GET /api/v1/auth/refresh`   | Proactive refresh (token rotation). Returns new tokens or `null`.                       |
| `getCachedUser()`             | —                            | Reads the cached profile from localStorage (`null` if absent or invalid).               |
| `setCachedUser(user)`         | —                            | Writes the profile cache. Called automatically by `fetchMe()`.                          |

### Refresh token

`authorizedFetch` automatically handles refresh:

1. Initial request with access token
2. If 401 → calls `GET /api/v1/auth/refresh` with the refresh token
3. If success → retries the initial request with the new token
4. If refresh fails with a 401 → `clearTokens()` — unless another tab already rotated the tokens (the refresh token in localStorage changed), in which case the other tab's tokens are adopted. Non-401 failures (network, 5xx) never clear tokens.

A lock (`refreshInFlight`) prevents parallel refresh calls.

### Errors

`AuthError` extends `Error` and adds a `status: number` field. The message is extracted from the JSON body (`detail` string or `detail[0].msg`).

## AuthContext (src/contexts/)

| File               | Role                                              |
| ------------------ | ------------------------------------------------- |
| `AuthContext.ts`   | Defines `AuthContextValue`                        |
| `AuthProvider.tsx` | Hydration on mount, exposes login/register/logout |
| `useAuth.ts`       | `useAuth()` hook                                  |

### AuthContextValue interface

```typescript
{
  client: AuthClient;
  user: AuthUser | null;
  isAuthenticated: boolean; // = user !== null
  isLoading: boolean; // true during initial hydration
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}
```

### Hydration on startup

`AuthProvider` renders optimistically, then validates in the background:

1. Synchronous init: if a refresh token exists, `user` starts from the cached profile (`hm_auth_user`) — the UI renders logged-in on first paint, no guest flash. `isLoading` is only `true` when tokens exist without a cached profile.
2. On mount: `refreshSession()` (rotation → the 7-day expiry slides forward on every visit) then `fetchMe()` to refresh `user` and the cache.
3. Downgrade to guest **only** on a confirmed 401 (`clearTokens()` + `user = null`). Network errors keep the optimistic state.

### Placement in the React tree

`AuthProvider` is mounted in `AppLayout`. It does **not** wrap `GameLayout` (the `/game/:id` page has no header or auth context directly — but `PodiumView` can access `useAuth` via the tree if needed through `AppLayout`).

> **Note:** `GameLayout` wraps only `GameProvider`. If a page in `GameLayout` needs `AuthContext`, either move `AuthProvider` up into `App.tsx`, or use another mechanism (currently `PodiumView` accesses `useAuth` because it is rendered in `GamePage`, which is inside `AppLayout` → `GameLayout` via the router).

## AuthModal (src/components/AuthModal.tsx)

Login/register modal triggered from `Header`. Uses `useAuth()` to call `login()` or `register()`. Closes via `onClose()` passed as a prop.

## Adding an auth-related feature

- Authenticated API call → use `authClient.authorizedFetch(url, options)` (handles refresh automatically)
- Protect a page → check `isAuthenticated` and `isLoading` before rendering content
- New user info → extend `AuthUser` in `AuthClient.ts` and `AuthContextValue` if it needs to be exposed
