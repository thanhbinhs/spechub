"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthResponse, AuthTokens, AuthUser } from "@spechub/api-client";
import {
  clearAuthTokens,
  persistAuthTokens,
  readAuthTokens,
} from "@spechub/auth";
import { api } from "@/lib/api";

type AuthContextValue = {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  signIn: (payload: {
    email: string;
    password: string;
  }) => Promise<AuthResponse>;
  signUp: (payload: {
    email: string;
    password: string;
    username?: string;
    display_name?: string;
  }) => Promise<AuthResponse>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistAuth = useCallback((response: AuthResponse) => {
    persistAuthTokens(localStorage, response.tokens);
    setTokens(response.tokens);
    setUser(response.user);
  }, []);

  const clearSession = useCallback(() => {
    clearAuthTokens(localStorage);
    setTokens(null);
    setUser(null);
  }, []);

  const signOut = useCallback(() => {
    const storedTokens = readAuthTokens(localStorage);
    clearSession();

    if (storedTokens?.access_token) {
      void api.logout(storedTokens.access_token).catch(() => undefined);
    }
  }, [clearSession]);

  const refreshSession = useCallback(async (refreshToken: string) => {
    const refreshedTokens = await api.refreshAuthTokens(refreshToken);
    persistAuthTokens(localStorage, refreshedTokens);
    setTokens(refreshedTokens);
    return refreshedTokens;
  }, []);

  useEffect(() => {
    const storedTokens = readAuthTokens(localStorage);

    if (!storedTokens) {
      setIsLoading(false);
      return;
    }

    async function restoreSession() {
      try {
        let currentTokens = storedTokens!;

        if (currentTokens.expires_in <= 30) {
          currentTokens = await refreshSession(currentTokens.refresh_token);
        }

        try {
          setUser(await api.getMe(currentTokens.access_token));
        } catch {
          currentTokens = await refreshSession(currentTokens.refresh_token);
          setUser(await api.getMe(currentTokens.access_token));
        }

        setTokens(currentTokens);
      } catch {
        clearSession();
      } finally {
        setIsLoading(false);
      }
    }

    void restoreSession();
  }, [clearSession, refreshSession]);

  useEffect(() => {
    if (!tokens || !user || tokens.expires_in <= 0) return;

    const refreshDelay = Math.max((tokens.expires_in - 60) * 1_000, 1_000);
    const timer = window.setTimeout(() => {
      void refreshSession(tokens.refresh_token)
        .then((refreshedTokens) => api.getMe(refreshedTokens.access_token))
        .then(setUser)
        .catch(clearSession);
    }, refreshDelay);

    return () => window.clearTimeout(timer);
  }, [clearSession, refreshSession, tokens, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      tokens,
      isLoading,
      signIn: async (payload) => {
        const response = await api.login(payload);
        persistAuth(response);
        return response;
      },
      signUp: async (payload) => {
        const response = await api.register(payload);
        persistAuth(response);
        return response;
      },
      signOut,
    }),
    [isLoading, persistAuth, signOut, tokens, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
