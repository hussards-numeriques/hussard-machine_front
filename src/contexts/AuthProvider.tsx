import React, { useEffect, useMemo, useState } from 'react';
import {
  AuthClient,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
} from '../services/AuthClient';
import { AuthContext, type AuthContextValue } from './AuthContext';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const client = useMemo(() => new AuthClient(), []);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      if (!client.getAccessToken()) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await client.fetchMe();
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        client.clearTokens();
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

  const value: AuthContextValue = {
    client,
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
