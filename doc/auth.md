# Auth — Authentification

L'authentification est optionnelle : un joueur peut jouer sans compte. Le compte permet de sauvegarder l'XP et l'historique des parties.

## AuthClient (src/services/AuthClient.ts)

Client HTTP vers le service FastAuth (`VITE_FASTAUTH_URL`).

### Stockage des tokens

Les tokens sont stockés dans `localStorage` :

| Clé                | Contenu                      |
| ------------------ | ---------------------------- |
| `hm_access_token`  | JWT d'accès (court lifetime) |
| `hm_refresh_token` | JWT de rafraîchissement      |

### Méthodes publiques

| Méthode                       | Endpoint                     | Description                                                                               |
| ----------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| `login(payload)`              | `POST /api/v1/auth/login`    | Form URL-encoded. Stocke les tokens.                                                      |
| `register(payload)`           | `POST /api/v1/auth/register` | JSON. Stocke les tokens.                                                                  |
| `logout()`                    | `POST /api/v1/auth/logout`   | Efface les tokens. Erreurs réseau ignorées.                                               |
| `fetchMe()`                   | `GET /api/v1/auth/me`        | Retourne `AuthUser`.                                                                      |
| `authorizedFetch(url, init?)` | —                            | `fetch` avec header `Authorization: Bearer <token>`. Retry automatique après refresh 401. |
| `getAccessToken()`            | —                            | Lit depuis localStorage.                                                                  |
| `clearTokens()`               | —                            | Supprime les deux clés de localStorage.                                                   |

### Refresh token

`authorizedFetch` gère automatiquement le refresh :

1. Requête initiale avec access token
2. Si 401 → appel à `GET /api/v1/auth/refresh` avec le refresh token
3. Si succès → re-tente la requête initiale avec le nouveau token
4. Si le refresh échoue → `clearTokens()`, retourne la réponse 401

Un verrou (`refreshInFlight`) évite les appels parallèles au refresh.

### Erreurs

`AuthError` étend `Error` et ajoute un champ `status: number`. Le message est extrait du corps JSON (`detail` string ou `detail[0].msg`).

## AuthContext (src/contexts/)

| Fichier            | Rôle                                               |
| ------------------ | -------------------------------------------------- |
| `AuthContext.ts`   | Définit `AuthContextValue`                         |
| `AuthProvider.tsx` | Hydratation au mount, expose login/register/logout |
| `useAuth.ts`       | Hook `useAuth()`                                   |

### Interface AuthContextValue

```typescript
{
  client: AuthClient;
  user: AuthUser | null;
  isAuthenticated: boolean; // = user !== null
  isLoading: boolean; // true pendant l'hydratation initiale
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}
```

### Hydratation au démarrage

`AuthProvider` tente de récupérer le profil au mount :

1. Si pas d'access token en localStorage → `isLoading = false`, `user = null`
2. Si token présent → `fetchMe()` pour hydrater `user`
3. Si `fetchMe()` échoue (token expiré, invalide) → `clearTokens()`, `user = null`

### Placement dans l'arbre React

`AuthProvider` est monté dans `AppLayout`. Il n'enveloppe **pas** `GameLayout` (la page `/game/:id` n'a pas de header ni de contexte auth directement — mais `PodiumView` importe `useAuth` via l'arbre si besoin via `AppLayout`).

> **Note :** `GameLayout` enveloppe uniquement `GameProvider`. Si une page dans `GameLayout` a besoin d'`AuthContext`, il faut soit remonter `AuthProvider` dans `App.tsx`, soit utiliser un autre mécanisme (actuellement `PodiumView` accède à `useAuth` parce qu'il est rendu dans `GamePage` qui est lui dans `AppLayout` → `GameLayout` via le routeur).

## AuthModal (src/components/AuthModal.tsx)

Modale de connexion/inscription déclenchée depuis `Header`. Utilise `useAuth()` pour appeler `login()` ou `register()`. Se ferme via `onClose()` passé en prop.

## Ajouter une feature liée à l'auth

- Appel API authentifié → utiliser `authClient.authorizedFetch(url, options)` (gère le refresh automatiquement)
- Protéger une page → vérifier `isAuthenticated` et `isLoading` avant d'afficher le contenu
- Nouvelle info utilisateur → étendre `AuthUser` dans `AuthClient.ts` et `AuthContextValue` si elle doit être exposée
