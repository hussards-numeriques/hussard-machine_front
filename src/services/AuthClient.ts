import { z } from 'zod';

const authUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

const tokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
});

export type TokenResponse = z.infer<typeof tokenResponseSchema>;

const errorDetailSchema = z.object({
  detail: z.union([z.string(), z.array(z.object({ msg: z.string() }))]),
});

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
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
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

  public loginWithGoogle(): void {
    window.location.href = `${this.baseUrl}/api/v1/auth/google/login`;
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

    const tokens = tokenResponseSchema.parse(await response.json());
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

    const tokens = tokenResponseSchema.parse(await response.json());
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
    return authUserSchema.parse(await response.json());
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
        const tokens = tokenResponseSchema.parse(await response.json());
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

async function extractMessage(response: Response): Promise<string> {
  const fallback = `Request failed (${response.status})`;
  try {
    const parsed = errorDetailSchema.safeParse(await response.json());
    if (!parsed.success) {
      return fallback;
    }
    const { detail } = parsed.data;
    if (typeof detail === 'string') {
      return detail;
    }
    return detail[0]?.msg ?? fallback;
  } catch {
    return fallback;
  }
}
