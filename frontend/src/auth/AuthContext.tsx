import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import {
  api,
  clearTokens,
  getRefreshToken,
  setAuthLostHandler,
  setTokens,
} from "../api/client";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  has_security_key: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Returns true if fully logged in, false if a second factor is still needed. */
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  registerSecurityKey: (name: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const resp = await api.get<User>("/auth/me/");
    setUser(resp.data);
  }, []);

  const logout = useCallback(async () => {
    const refresh = getRefreshToken();
    try {
      if (refresh) await api.post("/auth/logout/", { refresh });
    } catch {
      // ignore network / already-expired errors on logout
    }
    clearTokens();
    setUser(null);
  }, []);

  // Wire the client's "auth lost" hook (failed refresh after 3 days) to logout.
  useEffect(() => {
    setAuthLostHandler(() => {
      clearTokens();
      setUser(null);
    });
    return () => setAuthLostHandler(null);
  }, []);

  // On startup, if we have a refresh token, try to restore the session.
  useEffect(() => {
    (async () => {
      if (!getRefreshToken()) {
        setLoading(false);
        return;
      }
      try {
        // A 401 here triggers the client's refresh interceptor.
        await refreshUser();
      } catch {
        clearTokens();
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshUser]);

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      const resp = await api.post("/auth/login/", { username, password });
      if (resp.data.mfa_required === false) {
        setTokens(resp.data.tokens);
        await refreshUser();
        return true;
      }
      // Second factor required: run the YubiKey ceremony in the browser.
      const assertion = await startAuthentication({
        optionsJSON: resp.data.webauthn_options,
      });
      const verify = await api.post("/auth/login/verify/", {
        mfa_token: resp.data.mfa_token,
        credential: assertion,
      });
      setTokens(verify.data.tokens);
      await refreshUser();
      return true;
    },
    [refreshUser],
  );

  const registerSecurityKey = useCallback(
    async (name: string) => {
      const begin = await api.get("/auth/webauthn/register/begin/");
      const attestation = await startRegistration({
        optionsJSON: begin.data.webauthn_options,
      });
      await api.post("/auth/webauthn/register/complete/", {
        challenge_token: begin.data.challenge_token,
        credential: attestation,
        name,
      });
      await refreshUser();
    },
    [refreshUser],
  );

  const value = useMemo(
    () => ({ user, loading, login, logout, registerSecurityKey, refreshUser }),
    [user, loading, login, logout, registerSecurityKey, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
