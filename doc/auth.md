# Auth — Authentication

Authentication is optional: a player can play without an account. An account allows saving XP and game history.

## AuthClient (src/services/AuthClient.ts)

HTTP client for the FastAuth service (`VITE_FASTAUTH_URL`).

### Token storage

Tokens are stored in `localStorage`:

| Key                | Content                     |
| ------------------ | --------------------------- |
| `hm_access_token`  | Access JWT (short lifetime) |
| `hm_refresh_token` | Refresh JWT                 |

### Public methods

| Method                        | Endpoint                     | Description                                                                             |
| ----------------------------- | ---------------------------- | --------------------------------------------------------------------------------------- |
| `login(payload)`              | `POST /api/v1/auth/login`    | Form URL-encoded. Stores tokens.                                                        |
| `register(payload)`           | `POST /api/v1/auth/register` | JSON. Stores tokens.                                                                    |
| `logout()`                    | `POST /api/v1/auth/logout`   | Clears tokens. Network errors ignored.                                                  |
| `fetchMe()`                   | `GET /api/v1/auth/me`        | Returns `AuthUser`.                                                                     |
| `authorizedFetch(url, init?)` | —                            | `fetch` with `Authorization: Bearer <token>` header. Automatic retry after 401 refresh. |
| `getAccessToken()`            | —                            | Reads from localStorage.                                                                |
| `clearTokens()`               | —                            | Removes both localStorage keys.                                                         |

### Refresh token

`authorizedFetch` automatically handles refresh:

1. Initial request with access token
2. If 401 → calls `GET /api/v1/auth/refresh` with the refresh token
3. If success → retries the initial request with the new token
4. If refresh fails → `clearTokens()`, returns the 401 response

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

`AuthProvider` attempts to fetch the profile on mount:

1. If no access token in localStorage → `isLoading = false`, `user = null`
2. If token present → `fetchMe()` to hydrate `user`
3. If `fetchMe()` fails (expired/invalid token) → `clearTokens()`, `user = null`

### Placement in the React tree

`AuthProvider` is mounted in `AppLayout`. It does **not** wrap `GameLayout` (the `/game/:id` page has no header or auth context directly — but `PodiumView` can access `useAuth` via the tree if needed through `AppLayout`).

> **Note:** `GameLayout` wraps only `GameProvider`. If a page in `GameLayout` needs `AuthContext`, either move `AuthProvider` up into `App.tsx`, or use another mechanism (currently `PodiumView` accesses `useAuth` because it is rendered in `GamePage`, which is inside `AppLayout` → `GameLayout` via the router).

## AuthModal (src/components/AuthModal.tsx)

Login/register modal triggered from `Header`. Uses `useAuth()` to call `login()` or `register()`. Closes via `onClose()` passed as a prop.

## Adding an auth-related feature

- Authenticated API call → use `authClient.authorizedFetch(url, options)` (handles refresh automatically)
- Protect a page → check `isAuthenticated` and `isLoading` before rendering content
- New user info → extend `AuthUser` in `AuthClient.ts` and `AuthContextValue` if it needs to be exposed
