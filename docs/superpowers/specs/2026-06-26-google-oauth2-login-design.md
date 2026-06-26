# Connexion Google OAuth2 — Design

**Date:** 2026-06-26
**Portée:** Deux repos — `fastauth` (backend auth, Railway) et `front` (SPA Calc Rush, Vercel).

## Objectif

Permettre aux utilisateurs de se connecter via leur compte Google (OAuth2 / OpenID
Connect). Le username dérivé est le **prénom** (`given_name`) si Google le fournit,
sinon l'**email**. En cas de collision d'unicité du username, on ajoute un suffixe
aléatoire court (ex. `Pierre-a4f9`).

## Décisions clés

- **Retour des tokens vers le SPA :** redirect + fragment d'URL. Le callback backend
  redirige le navigateur vers une route front avec les tokens dans le fragment
  (`#access_token=...`). Le fragment n'est jamais transmis aux serveurs. Cohérent avec
  l'archi existante (localStorage + Bearer).
- **Collision username :** suffixe aléatoire court en un seul essai (pas de boucle).
- **Bouton :** unique, dans l'`AuthModal` (au-dessus des formulaires login et register),
  avec un séparateur « ou ».

## Flux

```
[SPA] clic "Continuer avec Google"
  → window.location = {BACKEND}/api/v1/auth/google/login   (navigation top-level)
[fastauth /login] → 302 → [Google consentement]
  → user accepte
[fastauth /callback?code&state]
  → échange code → userinfo (sub, email, given_name, ...)
  → create_or_update_oauth2_user (username = given_name | email, suffixe si collision)
  → génère access + refresh JWT maison
  → 302 → {FRONTEND_URL}/auth/callback#access_token=...&refresh_token=...&token_type=bearer
[SPA /auth/callback] lit le fragment → localStorage → reloadUser() → redirige accueil
```

Sur erreur, le callback redirige vers
`{FRONTEND_URL}/auth/callback#error=<message>` ; le front affiche un message lisible.

## Backend (fastauth)

### `common/settings.py`
- Ajouter `FRONTEND_URL: str` (ex. `https://www.calc-rush.fr`).

### `models/schemas.py` — `GoogleUserInfo`
- Ajouter `given_name: str | None = None`.
- Rendre optionnels (Google ne les garantit pas) : `name: str | None = None`,
  `family_name: str | None = None`, `email_verified: bool = False`.
- Obligatoires : `email`, `sub`.

### `services/auth.py`
- `_generate_unique_username(session, base)` : si `base` libre → `base`, sinon
  `f"{base}-{secrets.token_hex(2)}"` (suffixe aléatoire court). Vérifie l'unicité via le
  repository.
- `create_or_update_oauth2_user` : pour un nouveau compte, passer le username par
  `_generate_unique_username`. (La logique de liaison par `oauth_id` puis `email`
  existante est conservée.)

### `routers/google_auth.py` — `/callback`
- Dériver `username_base = user_info.given_name or user_info.email`.
- Succès → `RedirectResponse` vers
  `{FRONTEND_URL}/auth/callback#access_token=...&refresh_token=...&token_type=bearer`.
- Erreur → `RedirectResponse` vers `{FRONTEND_URL}/auth/callback#error=...`.
- `/login` inchangé (renvoie déjà la redirection Authlib). `SessionMiddleware` gère le
  `state` (cookie SameSite=Lax suffit, tout est en navigation top-level GET).

## Frontend (front)

### `services/AuthClient.ts`
- `loginWithGoogle()` : `window.location.href = {baseUrl}/api/v1/auth/google/login`.
- Helper pour parser/consommer les tokens depuis le fragment.

### `contexts/AuthContext.ts` + `AuthProvider.tsx`
- Exposer `reloadUser(): Promise<void>` (= `fetchMe` + `setUser`) pour rafraîchir l'état
  après stockage des tokens par la page de callback.

### Nouvelle page `OAuthCallbackPage` (route `/auth/callback`)
- Parse `location.hash` ; si `error` → message ; sinon `setTokens`, `reloadUser`,
  nettoie l'URL, redirige vers l'accueil.

### `components/AuthModal.tsx`
- Bouton « Continuer avec Google » + séparateur « ou », au-dessus des deux formulaires.

### Routing
- Déclarer la route `/auth/callback`.

## Actions manuelles (faites par l'utilisateur)

1. Google Cloud Console : projet + écran de consentement (External, scopes
   `openid email profile`) + OAuth client ID (Web application).
2. Authorized redirect URI **exacte** :
   `https://fastauth-backend.up.railway.app/api/v1/auth/google/callback`.
3. Variables d'env Railway (projet fastauth) :
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` = `https://fastauth-backend.up.railway.app/api/v1/auth/google/callback`
   - `FRONTEND_URL` = `https://www.calc-rush.fr`

## Tests

- **Backend (pytest)** : dérivation du username (given_name vs email) ; collision →
  suffixe aléatoire ; liaison d'un compte OAuth à un compte email existant.
- **Manuel e2e** : clic bouton → consentement Google → retour sur l'app connecté,
  username = prénom.

## Hors périmètre (YAGNI)

- Changement de username par l'utilisateur.
- Autres providers (Apple, GitHub…).
- Déliaison de compte OAuth.
