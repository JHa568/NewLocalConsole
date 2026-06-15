import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const REFRESH_KEY = "nlc.refresh";

let accessToken: string | null = null;
let onAuthLost: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string | null) {
  if (token) localStorage.setItem(REFRESH_KEY, token);
  else localStorage.removeItem(REFRESH_KEY);
}

export function setTokens(tokens: { access: string; refresh: string }) {
  setAccessToken(tokens.access);
  setRefreshToken(tokens.refresh);
}

export function clearTokens() {
  setAccessToken(null);
  setRefreshToken(null);
}

/** Registered by AuthContext so a failed refresh can force a logout/redirect. */
export function setAuthLostHandler(handler: (() => void) | null) {
  onAuthLost = handler;
}

export const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const resp = await axios.post("/api/auth/refresh/", { refresh });
    const newAccess: string = resp.data.access;
    setAccessToken(newAccess);
    if (resp.data.refresh) setRefreshToken(resp.data.refresh);
    return newAccess;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retried?: boolean;
    };
    const isAuthEndpoint = original?.url?.includes("/auth/login");

    if (error.response?.status === 401 && original && !original._retried && !isAuthEndpoint) {
      original._retried = true;
      // Coalesce concurrent refreshes.
      if (!refreshing) refreshing = refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;

      if (newToken) {
        original.headers.set("Authorization", `Bearer ${newToken}`);
        return api(original);
      }
      // Refresh failed — after the 3-day window this forces re-login.
      clearTokens();
      onAuthLost?.();
    }
    return Promise.reject(error);
  },
);
