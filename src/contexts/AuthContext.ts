import { createContext } from 'react';
import type { AuthClient, AuthUser, LoginPayload, RegisterPayload } from '../services/AuthClient';

export interface AuthContextValue {
  client: AuthClient;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
