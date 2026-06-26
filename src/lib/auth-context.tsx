"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  api,
  refreshSession,
  registerSessionExpiredHandler,
  setAccessToken,
  type AuthResponse,
  type AuthUser,
} from "./api";
import { getMyPermissions } from "./permissions";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** True when the current user holds `key` (SUPER_ADMIN always true). */
  can: (key: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const SUPER_ADMIN = "SUPER_ADMIN";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the user's effective permission keys (best-effort; gating fails closed).
  const loadPermissions = useCallback(async () => {
    try {
      const keys = await getMyPermissions();
      setPermissions(new Set(keys));
    } catch {
      setPermissions(new Set());
    }
  }, []);

  // Silent bootstrap: restore the session from the refresh cookie, then perms.
  useEffect(() => {
    let active = true;
    refreshSession()
      .then(async (result) => {
        if (!active) return;
        if (result) {
          setUser(result.user);
          await loadPermissions();
        }
        if (active) setIsLoading(false);
      })
      .catch(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadPermissions]);

  // When a transparent refresh ultimately fails, drop the user and bounce.
  useEffect(() => {
    registerSessionExpiredHandler(() => {
      setAccessToken(null);
      setUser(null);
      setPermissions(new Set());
      router.replace("/login");
    });
  }, [router]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
      });
      setAccessToken(data.accessToken);
      setUser(data.user);
      await loadPermissions();
      router.replace("/dashboard");
    },
    [router, loadPermissions],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore — clear local state regardless
    }
    setAccessToken(null);
    setUser(null);
    setPermissions(new Set());
    router.replace("/login");
  }, [router]);

  const can = useCallback(
    (key: string): boolean => {
      if (user?.role === SUPER_ADMIN) return true;
      return permissions.has(key);
    },
    [user, permissions],
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
