export const AUTH_TOKEN_STORAGE_KEYS = {
  accessToken: "spechub_access_token",
  refreshToken: "spechub_refresh_token",
} as const;

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export type TokenStorage = {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
};

export function persistAuthTokens(storage: TokenStorage, tokens: AuthTokens) {
  storage.setItem(AUTH_TOKEN_STORAGE_KEYS.accessToken, tokens.access_token);
  storage.setItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken, tokens.refresh_token);
}

export function readAuthTokens(storage: TokenStorage): AuthTokens | null {
  const accessToken = storage.getItem(AUTH_TOKEN_STORAGE_KEYS.accessToken);
  const refreshToken = storage.getItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken);

  if (!accessToken || !refreshToken) return null;

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 0,
  };
}

export function clearAuthTokens(storage: TokenStorage) {
  storage.removeItem(AUTH_TOKEN_STORAGE_KEYS.accessToken);
  storage.removeItem(AUTH_TOKEN_STORAGE_KEYS.refreshToken);
}
