export interface AuthUser {
  id: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

const ACCESS_TOKEN_KEY = 'hm_access_token';
const REFRESH_TOKEN_KEY = 'hm_refresh_token';

const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_FASTAUTH_URL ?? 'http://localhost:8000';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

export class AuthError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export class AuthClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getBaseUrl();
  }

  public getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  public setTokens(tokens: TokenResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  }

  public clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  public async login(payload: LoginPayload): Promise<TokenResponse> {
    const form = new URLSearchParams();
    form.append('username', payload.username);
    form.append('password', payload.password);

    const response = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    if (!response.ok) {
      throw new AuthError(response.status, await extractMessage(response));
    }

    const tokens = (await response.json()) as TokenResponse;
    this.setTokens(tokens);
    return tokens;
  }

  public async register(payload: RegisterPayload): Promise<TokenResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new AuthError(response.status, await extractMessage(response));
    }

    const tokens = (await response.json()) as TokenResponse;
    this.setTokens(tokens);
    return tokens;
  }

  public async logout(): Promise<void> {
    const token = this.getAccessToken();
    if (token) {
      try {
        await fetch(`${this.baseUrl}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        /* ignore network errors on logout */
      }
    }
    this.clearTokens();
  }

  public async fetchMe(): Promise<AuthUser> {
    const response = await this.authorizedFetch(`${this.baseUrl}/api/v1/auth/me`);
    if (!response.ok) {
      throw new AuthError(response.status, await extractMessage(response));
    }
    return (await response.json()) as AuthUser;
  }

  public async authorizedFetch(input: string, init: RequestInit = {}): Promise<Response> {
    const token = this.getAccessToken();
    const headers = new Headers(init.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(input, { ...init, headers });

    if (response.status !== 401) {
      return response;
    }

    const refreshed = await this.tryRefresh();
    if (!refreshed) {
      return response;
    }

    const retryHeaders = new Headers(init.headers);
    retryHeaders.set('Authorization', `Bearer ${refreshed.access_token}`);
    return fetch(input, { ...init, headers: retryHeaders });
  }

  private refreshInFlight: Promise<TokenResponse | null> | null = null;

  private async tryRefresh(): Promise<TokenResponse | null> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    this.refreshInFlight = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
        if (!response.ok) {
          this.clearTokens();
          return null;
        }
        const tokens = (await response.json()) as TokenResponse;
        this.setTokens(tokens);
        return tokens;
      } catch {
        return null;
      } finally {
        this.refreshInFlight = null;
      }
    })();

    return this.refreshInFlight;
  }
}

async function extractMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.detail === 'string') {
      return data.detail;
    }
    if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
      return data.detail[0].msg;
    }
  } catch {
    /* fall through */
  }
  return `Request failed (${response.status})`;
}
