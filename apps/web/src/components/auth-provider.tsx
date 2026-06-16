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
import { api } from "@/lib/api";

const ACCESS_TOKEN_KEY = "spechub_access_token";
const REFRESH_TOKEN_KEY = "spechub_refresh_token";

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
    localStorage.setItem(ACCESS_TOKEN_KEY, response.tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.tokens.refresh_token);
    setTokens(response.tokens);
    setUser(response.user);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setTokens(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!accessToken || !refreshToken) {
      setIsLoading(false);
      return;
    }

    setTokens({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 0,
    });

    api
      .getMe(accessToken)
      .then(setUser)
      .catch(signOut)
      .finally(() => setIsLoading(false));
  }, [signOut]);

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
