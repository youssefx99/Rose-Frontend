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

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Silent bootstrap: try to restore the session from the refresh cookie.
  useEffect(() => {
    let active = true;
    refreshSession().then((result) => {
      if (!active) return;
      if (result) setUser(result.user);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  // When a transparent refresh ultimately fails, drop the user and bounce.
  useEffect(() => {
    registerSessionExpiredHandler(() => {
      setAccessToken(null);
      setUser(null);
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
      router.replace("/dashboard");
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore — clear local state regardless
    }
    setAccessToken(null);
    setUser(null);
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
