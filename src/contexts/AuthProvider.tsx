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
