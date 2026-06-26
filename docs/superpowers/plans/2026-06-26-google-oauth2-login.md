# Connexion Google OAuth2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre la connexion via Google OAuth2, le username dérivé étant le prénom (ou l'email à défaut), avec retour des tokens au SPA par redirect + fragment d'URL.

**Architecture:** Le SPA redirige (navigation top-level) vers `fastauth /api/v1/auth/google/login`, qui passe par Google puis revient sur `/callback`. Le callback crée/lie l'utilisateur, génère les JWT maison, et redirige le navigateur vers `{FRONTEND_URL}/auth/callback#access_token=...&refresh_token=...`. Une page front lit le fragment, stocke les tokens et rafraîchit l'état d'auth.

**Tech Stack:** Backend = FastAPI + Authlib + SQLModel async + pytest. Frontend = React 19 + TypeScript + react-router-dom v7 + vitest + testing-library.

## Global Constraints

- **Backend repo :** `/home/tdemares/dev_folder/hussards_orga/fastauth`. Branche de travail : `feat/google-oauth2-login`.
- **Frontend repo :** `/home/tdemares/dev_folder/hussards_orga/front`. Branche de travail : `feat/google-oauth2-login` (déjà créée, contient la spec).
- **Backend code style :** pas de commentaires (code auto-documenté) ; imports en haut de module ; types natifs (`str | None`) ; >2 params → un par ligne + virgule finale ; tests typés `-> None`, structurés `# Given / # When / # Then`, `fake = Faker()` au niveau module.
- **Frontend code style :** TypeScript strict, pas de `any`, pas de commentaires, composants fonctionnels.
- **Validation backend (avant chaque commit) :** `uv run ruff check . --fix && uv run ruff format . && uv run ty check . && uv run pytest`.
- **Validation frontend (avant chaque commit) :** `npm run lint && npx prettier --check . && npx tsc --noEmit && npm run test`.
- **Valeurs exactes :** route de callback front = `/auth/callback` ; endpoint backend login = `/api/v1/auth/google/login` ; clés localStorage = `hm_access_token`, `hm_refresh_token` (déjà définies dans `AuthClient`).

---

## Task 1 — Backend : settings `FRONTEND_URL` + schéma `GoogleUserInfo` tolérant

**Files:**
- Modify: `fastauth/common/settings.py`
- Modify: `fastauth/models/schemas.py:36-41`
- Test: `tests/test_oauth2.py` (créer)

**Interfaces:**
- Produces : `settings.FRONTEND_URL: str` (défaut `http://localhost:5173`). `GoogleUserInfo` avec champs `email: EmailStr`, `sub: str` (obligatoires), `given_name: str | None = None`, `name: str | None = None`, `family_name: str | None = None`, `email_verified: bool = False`.

- [ ] **Step 1: Écrire les tests du schéma (échec attendu)**

Créer `tests/test_oauth2.py` :

```python
from faker import Faker

from fastauth.models.schemas import GoogleUserInfo

fake = Faker()


class TestGoogleUserInfo:
    def test_accepts_minimal_payload_without_names(self) -> None:
        # Given
        payload = {"email": fake.email(), "sub": fake.uuid4()}

        # When
        info = GoogleUserInfo(**payload)

        # Then
        assert info.given_name is None
        assert info.family_name is None
        assert info.name is None
        assert info.email_verified is False

    def test_keeps_given_name_when_provided(self) -> None:
        # Given
        given_name = fake.first_name()
        payload = {"email": fake.email(), "sub": fake.uuid4(), "given_name": given_name}

        # When
        info = GoogleUserInfo(**payload)

        # Then
        assert info.given_name == given_name
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `uv run pytest tests/test_oauth2.py -v`
Expected: FAIL (`given_name` inconnu / champs obligatoires manquants).

- [ ] **Step 3: Rendre `GoogleUserInfo` tolérant**

Dans `fastauth/models/schemas.py`, remplacer la classe `GoogleUserInfo` :

```python
class GoogleUserInfo(BaseModel):
    email: EmailStr
    sub: str
    given_name: str | None = None
    name: str | None = None
    family_name: str | None = None
    email_verified: bool = False
```

- [ ] **Step 4: Ajouter `FRONTEND_URL` aux settings**

Dans `fastauth/common/settings.py`, sous le bloc Google OAuth :

```python
    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"
```

- [ ] **Step 5: Lancer le test, vérifier le succès**

Run: `uv run pytest tests/test_oauth2.py -v`
Expected: PASS (2 tests).

- [ ] **Step 6: Validation + commit**

```bash
cd /home/tdemares/dev_folder/hussards_orga/fastauth
uv run ruff check . --fix && uv run ruff format . && uv run ty check . && uv run pytest
git checkout -b feat/google-oauth2-login
git add fastauth/common/settings.py fastauth/models/schemas.py tests/test_oauth2.py
git commit -m "feat: tolerant GoogleUserInfo schema and FRONTEND_URL setting"
```

---

## Task 2 — Backend : dérivation username + anti-collision dans `AuthService`

**Files:**
- Modify: `fastauth/services/auth.py`
- Test: `tests/test_oauth2.py`

**Interfaces:**
- Consumes : `UserRepository.get_or_none(session, **kwargs)`, `User`, `settings`.
- Produces :
  - `AuthService._generate_unique_username(session: AsyncSession, base: str) -> str` : renvoie `base` s'il est libre, sinon `f"{base}-{secrets.token_hex(2)}"`.
  - `create_or_update_oauth2_user(...)` inchangée en signature mais utilise `_generate_unique_username` pour le username d'un nouvel utilisateur.

- [ ] **Step 1: Écrire les tests du service (échec attendu)**

Ajouter dans `tests/test_oauth2.py` :

```python
from sqlmodel.ext.asyncio.session import AsyncSession

from fastauth.db import TokenRepository, UserRepository
from fastauth.services.auth import AuthService

auth_service = AuthService(user_repository=UserRepository(), token_repository=TokenRepository())


class TestUniqueUsername:
    async def test_returns_base_when_free(self, session: AsyncSession) -> None:
        # Given
        base = fake.first_name()

        # When
        username = await auth_service._generate_unique_username(session=session, base=base)

        # Then
        assert username == base

    async def test_adds_random_suffix_on_collision(self, session: AsyncSession) -> None:
        # Given
        base = fake.first_name()
        await auth_service.create_or_update_oauth2_user(
            session=session,
            provider="google",
            provider_id=fake.uuid4(),
            email=fake.email(),
            username=base,
        )

        # When
        username = await auth_service._generate_unique_username(session=session, base=base)

        # Then
        assert username != base
        assert username.startswith(f"{base}-")


class TestCreateOrUpdateOAuth2User:
    async def test_new_user_with_taken_username_gets_suffix(self, session: AsyncSession) -> None:
        # Given
        base = fake.first_name()
        await auth_service.create_or_update_oauth2_user(
            session=session,
            provider="google",
            provider_id=fake.uuid4(),
            email=fake.email(),
            username=base,
        )

        # When
        user = await auth_service.create_or_update_oauth2_user(
            session=session,
            provider="google",
            provider_id=fake.uuid4(),
            email=fake.email(),
            username=base,
        )

        # Then
        assert user.username != base
        assert user.username.startswith(f"{base}-")

    async def test_links_oauth_to_existing_email_user(self, session: AsyncSession) -> None:
        # Given
        email = fake.email()
        provider_id = fake.uuid4()
        existing = User(
            email=email,
            username=fake.user_name(),
            hashed_password=auth_service._get_password_hash(fake.password()),
        )
        await UserRepository().create(session=session, item=existing)

        # When
        user = await auth_service.create_or_update_oauth2_user(
            session=session,
            provider="google",
            provider_id=provider_id,
            email=email,
            username=fake.first_name(),
        )

        # Then
        assert user.id == existing.id
        assert user.oauth_provider == "google"
        assert user.oauth_id == provider_id
```

Ajouter l'import `from fastauth.models.user import User` en haut du fichier de test.

- [ ] **Step 2: Lancer les tests, vérifier l'échec**

Run: `uv run pytest tests/test_oauth2.py -v`
Expected: FAIL (`_generate_unique_username` n'existe pas ; collision username → IntegrityError).

- [ ] **Step 3: Implémenter dans `AuthService`**

Dans `fastauth/services/auth.py`, ajouter l'import en haut du module :

```python
import secrets
```

Ajouter la méthode (par exemple juste avant `create_or_update_oauth2_user`) :

```python
    async def _generate_unique_username(
        self,
        session: AsyncSession,
        base: str,
    ) -> str:
        existing = await self.user_repository.get_or_none(session=session, username=base)
        if existing is None:
            return base
        return f"{base}-{secrets.token_hex(2)}"
```

Dans `create_or_update_oauth2_user`, remplacer le bloc de création du nouvel utilisateur (actuellement `user = User(email=email, username=username, ...)`) par :

```python
        unique_username = await self._generate_unique_username(session=session, base=username)

        random_password = uuid.uuid4().hex
        hashed_password = self._get_password_hash(random_password)

        user = User(
            email=email,
            username=unique_username,
            hashed_password=hashed_password,
            oauth_provider=provider,
            oauth_id=provider_id,
        )

        return await self.user_repository.create(session=session, item=user)
```

- [ ] **Step 4: Lancer les tests, vérifier le succès**

Run: `uv run pytest tests/test_oauth2.py -v`
Expected: PASS (tous les tests `TestUniqueUsername` + `TestCreateOrUpdateOAuth2User`).

- [ ] **Step 5: Validation + commit**

```bash
cd /home/tdemares/dev_folder/hussards_orga/fastauth
uv run ruff check . --fix && uv run ruff format . && uv run ty check . && uv run pytest
git add fastauth/services/auth.py tests/test_oauth2.py
git commit -m "feat: derive unique oauth username with random suffix on collision"
```

---

## Task 3 — Backend : callback redirige vers le front avec les tokens en fragment

**Files:**
- Modify: `fastauth/routers/google_auth.py`
- Test: `tests/test_oauth2.py`

**Interfaces:**
- Consumes : `oauth2.get_google_user_info(request) -> GoogleUserInfo`, `auth_service.create_or_update_oauth2_user(...)`, `auth_service.create_token_for_user(...)`, `settings.FRONTEND_URL`.
- Produces : `GET /api/v1/auth/google/callback` renvoie une `RedirectResponse` (307) vers `{FRONTEND_URL}/auth/callback#access_token=...&refresh_token=...&token_type=bearer` en succès, ou `{FRONTEND_URL}/auth/callback#error=...` en erreur.

- [ ] **Step 1: Écrire les tests du callback (échec attendu)**

Ajouter dans `tests/test_oauth2.py` :

```python
from httpx import AsyncClient

from fastauth.models.schemas import GoogleUserInfo
from fastauth.routers import google_auth

CALLBACK_URL = "/api/v1/auth/google/callback"


class TestGoogleCallback:
    async def test_redirects_to_frontend_with_tokens(
        self,
        client: AsyncClient,
        monkeypatch,
    ) -> None:
        # Given
        given_name = fake.first_name()

        async def fake_user_info(_request) -> GoogleUserInfo:
            return GoogleUserInfo(email=fake.email(), sub=fake.uuid4(), given_name=given_name)

        monkeypatch.setattr(google_auth.oauth2, "get_google_user_info", fake_user_info)

        # When
        response = await client.get(CALLBACK_URL, follow_redirects=False)

        # Then
        assert response.status_code == 307
        location = response.headers["location"]
        assert location.startswith("http://localhost:5173/auth/callback#")
        assert "access_token=" in location
        assert "refresh_token=" in location

    async def test_redirects_to_frontend_with_error_on_failure(
        self,
        client: AsyncClient,
        monkeypatch,
    ) -> None:
        # Given
        async def failing_user_info(_request) -> GoogleUserInfo:
            raise ValueError("boom")

        monkeypatch.setattr(google_auth.oauth2, "get_google_user_info", failing_user_info)

        # When
        response = await client.get(CALLBACK_URL, follow_redirects=False)

        # Then
        assert response.status_code == 307
        location = response.headers["location"]
        assert location.startswith("http://localhost:5173/auth/callback#error=")
```

- [ ] **Step 2: Lancer les tests, vérifier l'échec**

Run: `uv run pytest tests/test_oauth2.py::TestGoogleCallback -v`
Expected: FAIL (le callback renvoie un JSON `Token` / 500, pas une redirection 307).

- [ ] **Step 3: Réécrire le callback**

Remplacer le contenu de `fastauth/routers/google_auth.py` par :

```python
"""Routes pour l'authentification Google OAuth."""

from urllib.parse import urlencode

from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from fastauth.common.settings import settings
from fastauth.db import TokenRepository, UserRepository, get_async_session
from fastauth.services import auth, oauth2

router = APIRouter(tags=["google_auth"])

auth_service = auth.AuthService(
    user_repository=UserRepository(),
    token_repository=TokenRepository(),
)


def _frontend_redirect(fragment: dict[str, str]) -> RedirectResponse:
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/auth/callback#{urlencode(fragment)}")


@router.get("/login")
async def login_via_google(request: Request):
    """Initialize the Google authentication process."""
    return await oauth2.oauth.google.authorize_redirect(
        request,
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
    )


@router.get("/callback")
async def auth_callback_google(
    request: Request,
    session: AsyncSession = Depends(get_async_session),
) -> RedirectResponse:
    """Handle the Google authentication callback."""
    try:
        user_info = await oauth2.get_google_user_info(request)

        user = await auth_service.create_or_update_oauth2_user(
            session=session,
            provider="google",
            provider_id=user_info.sub,
            email=user_info.email,
            username=user_info.given_name or user_info.email,
        )

        access_token, refresh_token = await auth_service.create_token_for_user(
            session=session,
            user=user,
        )

        return _frontend_redirect(
            {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
            },
        )

    except Exception as e:  # noqa: BLE001
        return _frontend_redirect({"error": str(e)})
```

- [ ] **Step 4: Lancer les tests, vérifier le succès**

Run: `uv run pytest tests/test_oauth2.py -v`
Expected: PASS (tout le fichier).

- [ ] **Step 5: Validation + commit**

```bash
cd /home/tdemares/dev_folder/hussards_orga/fastauth
uv run ruff check . --fix && uv run ruff format . && uv run ty check . && uv run pytest
git add fastauth/routers/google_auth.py tests/test_oauth2.py
git commit -m "feat: redirect google callback to frontend with tokens fragment"
```

---

## Task 4 — Frontend : `AuthClient.loginWithGoogle` + parsing du fragment + `reloadUser`

**Files:**
- Modify: `src/services/AuthClient.ts`
- Modify: `src/contexts/AuthContext.ts`
- Modify: `src/contexts/AuthProvider.tsx`
- Test: `src/services/AuthClient.spec.ts` (créer)

**Interfaces:**
- Produces :
  - `AuthClient.loginWithGoogle(): void` → `window.location.href = {baseUrl}/api/v1/auth/google/login`.
  - fonction exportée `parseOAuthFragment(hash: string): { tokens?: TokenResponse; error?: string }`.
  - `AuthContextValue.reloadUser: () => Promise<void>`.

- [ ] **Step 1: Écrire le test du parsing (échec attendu)**

Créer `src/services/AuthClient.spec.ts` :

```ts
import { describe, expect, it } from 'vitest';
import { parseOAuthFragment } from './AuthClient';

describe('parseOAuthFragment', () => {
  it('extracts tokens from a success fragment', () => {
    const hash = '#access_token=abc&refresh_token=def&token_type=bearer';

    const result = parseOAuthFragment(hash);

    expect(result.tokens).toEqual({
      access_token: 'abc',
      refresh_token: 'def',
      token_type: 'bearer',
    });
    expect(result.error).toBeUndefined();
  });

  it('extracts an error message from an error fragment', () => {
    const hash = '#error=boom';

    const result = parseOAuthFragment(hash);

    expect(result.error).toBe('boom');
    expect(result.tokens).toBeUndefined();
  });

  it('returns nothing useful for an empty fragment', () => {
    const result = parseOAuthFragment('');

    expect(result.tokens).toBeUndefined();
    expect(result.error).toBeUndefined();
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `npm run test -- src/services/AuthClient.spec.ts`
Expected: FAIL (`parseOAuthFragment` non exporté).

- [ ] **Step 3: Implémenter dans `AuthClient.ts`**

Ajouter en bas de `src/services/AuthClient.ts`, après la classe :

```ts
export function parseOAuthFragment(hash: string): { tokens?: TokenResponse; error?: string } {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(raw);

  const error = params.get('error');
  if (error) {
    return { error };
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    return {
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: params.get('token_type') ?? 'bearer',
      },
    };
  }

  return {};
}
```

Ajouter la méthode dans la classe `AuthClient` (par exemple après `clearTokens`) :

```ts
  public loginWithGoogle(): void {
    window.location.href = `${this.baseUrl}/api/v1/auth/google/login`;
  }
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `npm run test -- src/services/AuthClient.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Ajouter `reloadUser` au contexte**

Dans `src/contexts/AuthContext.ts`, ajouter à l'interface `AuthContextValue` :

```ts
  reloadUser: () => Promise<void>;
```

Dans `src/contexts/AuthProvider.tsx`, ajouter la fonction et l'exposer dans `value` :

```ts
  const reloadUser = async () => {
    const me = await client.fetchMe();
    setUser(me);
  };
```

Puis dans l'objet `value`, ajouter `reloadUser,` à côté de `login`, `register`, `logout`.

- [ ] **Step 6: Validation + commit**

```bash
cd /home/tdemares/dev_folder/hussards_orga/front
npm run lint && npx prettier --check . && npx tsc --noEmit && npm run test
git add src/services/AuthClient.ts src/services/AuthClient.spec.ts src/contexts/AuthContext.ts src/contexts/AuthProvider.tsx
git commit -m "feat: add google login redirect, fragment parsing and reloadUser"
```

---

## Task 5 — Frontend : page `OAuthCallbackPage` + route `/auth/callback`

**Files:**
- Create: `src/pages/OAuthCallbackPage.tsx`
- Create: `src/pages/OAuthCallbackPage.spec.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes : `useAuth()` (`client`, `reloadUser`), `parseOAuthFragment`, `useNavigate` de react-router-dom.
- Produces : composant `OAuthCallbackPage` monté sur la route `/auth/callback`.

- [ ] **Step 1: Écrire le test de la page (échec attendu)**

Créer `src/pages/OAuthCallbackPage.spec.tsx` :

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OAuthCallbackPage } from './OAuthCallbackPage';

const navigate = vi.fn();
const reloadUser = vi.fn().mockResolvedValue(undefined);
const setTokens = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({ client: { setTokens }, reloadUser }),
}));

const renderWithHash = (hash: string) => {
  window.location.hash = hash;
  return render(
    <MemoryRouter>
      <OAuthCallbackPage />
    </MemoryRouter>,
  );
};

describe('OAuthCallbackPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
    window.location.hash = '';
  });

  it('stores tokens, reloads the user and navigates home on success', async () => {
    renderWithHash('#access_token=abc&refresh_token=def&token_type=bearer');

    await waitFor(() => {
      expect(setTokens).toHaveBeenCalledWith({
        access_token: 'abc',
        refresh_token: 'def',
        token_type: 'bearer',
      });
    });
    expect(reloadUser).toHaveBeenCalled();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/', { replace: true }));
  });

  it('shows an error message on error fragment', async () => {
    renderWithHash('#error=boom');

    expect(await screen.findByText(/boom/)).toBeInTheDocument();
    expect(setTokens).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `npm run test -- src/pages/OAuthCallbackPage.spec.tsx`
Expected: FAIL (module `OAuthCallbackPage` introuvable).

- [ ] **Step 3: Implémenter la page**

Créer `src/pages/OAuthCallbackPage.tsx` :

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { parseOAuthFragment } from '../services/AuthClient';

export const OAuthCallbackPage: React.FC = () => {
  const { client, reloadUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { tokens, error: fragmentError } = parseOAuthFragment(window.location.hash);

    if (fragmentError) {
      setError(fragmentError);
      return;
    }

    if (!tokens) {
      setError('Connexion Google impossible.');
      return;
    }

    const finalize = async () => {
      client.setTokens(tokens);
      await reloadUser();
      navigate('/', { replace: true });
    };

    void finalize();
  }, [client, reloadUser, navigate]);

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <div className="p-4 bg-rose-100 text-rose-700 rounded-xl text-center font-bold">
          Connexion Google échouée : {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <p className="text-slate-600 font-bold">Connexion en cours…</p>
    </div>
  );
};
```

- [ ] **Step 4: Brancher la route**

Dans `src/App.tsx`, ajouter l'import :

```tsx
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
```

Et la route à l'intérieur du `<Route element={<AppLayout />}>` (après `privacy-policy`) :

```tsx
          <Route path="auth/callback" element={<OAuthCallbackPage />} />
```

- [ ] **Step 5: Lancer les tests, vérifier le succès**

Run: `npm run test -- src/pages/OAuthCallbackPage.spec.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Validation + commit**

```bash
cd /home/tdemares/dev_folder/hussards_orga/front
npm run lint && npx prettier --check . && npx tsc --noEmit && npm run test
git add src/pages/OAuthCallbackPage.tsx src/pages/OAuthCallbackPage.spec.tsx src/App.tsx
git commit -m "feat: add oauth callback page consuming token fragment"
```

---

## Task 6 — Frontend : bouton « Continuer avec Google » dans l'`AuthModal`

**Files:**
- Modify: `src/components/AuthModal.tsx`
- Test: `src/components/AuthModal.spec.tsx` (créer)

**Interfaces:**
- Consumes : `useAuth()` (`client.loginWithGoogle`).
- Produces : un bouton, partagé entre les modes LOGIN et REGISTER, qui déclenche `client.loginWithGoogle()`.

- [ ] **Step 1: Écrire le test du bouton (échec attendu)**

Créer `src/components/AuthModal.spec.tsx` :

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthModal } from './AuthModal';

const loginWithGoogle = vi.fn();

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    client: { loginWithGoogle },
    login: vi.fn(),
    register: vi.fn(),
  }),
}));

describe('AuthModal', () => {
  it('triggers google login when the google button is clicked', () => {
    render(<AuthModal onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Google/ }));

    expect(loginWithGoogle).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec**

Run: `npm run test -- src/components/AuthModal.spec.tsx`
Expected: FAIL (aucun bouton « Google »).

- [ ] **Step 3: Ajouter le bouton dans l'`AuthModal`**

Dans `src/components/AuthModal.tsx`, créer un sous-composant au-dessus de `export const AuthModal` :

```tsx
const GoogleButton = () => {
  const { client } = useAuth();
  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={() => client.loginWithGoogle()}
      >
        Continuer avec Google
      </Button>
      <div className="flex items-center gap-3 text-slate-400 text-sm font-bold">
        <span className="h-px flex-1 bg-slate-200" />
        ou
        <span className="h-px flex-1 bg-slate-200" />
      </div>
    </div>
  );
};
```

Puis dans le JSX de `AuthModal`, insérer `<GoogleButton />` juste avant la ligne qui rend les formulaires :

```tsx
        <GoogleButton />

        {mode === 'LOGIN' ? <LoginForm onClose={onClose} /> : <RegisterForm onClose={onClose} />}
```

- [ ] **Step 4: Lancer le test, vérifier le succès**

Run: `npm run test -- src/components/AuthModal.spec.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Validation + commit**

```bash
cd /home/tdemares/dev_folder/hussards_orga/front
npm run lint && npx prettier --check . && npx tsc --noEmit && npm run test
git add src/components/AuthModal.tsx src/components/AuthModal.spec.tsx
git commit -m "feat: add continue with google button to auth modal"
```

---

## Task 7 — Vérification end-to-end (manuelle) + déploiement

**Files:** aucun (déploiement + test manuel).

- [ ] **Step 1: Déployer le backend**

Pousser la branche fastauth et la merger/déployer sur Railway (ou laisser Railway déployer la branche). Vérifier que les 4 variables sont présentes : `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `FRONTEND_URL`.

- [ ] **Step 2: Vérifier la config front**

S'assurer que `VITE_FASTAUTH_URL` pointe sur `https://fastauth-backend.up.railway.app` dans l'environnement Vercel (et `.env.local` si test local). Déployer le front.

- [ ] **Step 3: Test du flux complet**

Sur https://www.calc-rush.fr : ouvrir la modale de connexion → cliquer « Continuer avec Google » → consentement Google → retour automatique sur l'app, connecté. Vérifier dans le profil que le username = prénom Google.

- [ ] **Step 4: Test du cas erreur / collision**

Se connecter avec un 2ᵉ compte Google ayant le même prénom → vérifier que le username reçoit un suffixe (`Prénom-xxxx`) et que la connexion réussit quand même.

- [ ] **Step 5: Finaliser**

Mettre à jour `CHANGELOG.md` (front et fastauth), `npm version patch` côté front, et ouvrir les PR / merger selon le workflow habituel.

---

## Self-Review

- **Spec coverage :** FRONTEND_URL + schéma tolérant (T1) ; dérivation username given_name|email + collision suffixe aléatoire (T2) ; callback redirect+fragment & gestion d'erreur (T3) ; loginWithGoogle + parsing fragment + reloadUser (T4) ; page /auth/callback (T5) ; bouton AuthModal (T6) ; actions manuelles + e2e (T7). Toutes les sections de la spec sont couvertes.
- **Type consistency :** `parseOAuthFragment` renvoie `{ tokens?: TokenResponse; error?: string }` et est consommé tel quel en T5 ; `reloadUser: () => Promise<void>` défini en T4 et consommé en T5 ; `_generate_unique_username(session, base) -> str` défini et consommé en T2/T3 ; `GoogleUserInfo` (T1) consommé en T3 via `given_name`/`email`/`sub`.
- **Placeholders :** aucun ; tout le code et les commandes sont fournis.
