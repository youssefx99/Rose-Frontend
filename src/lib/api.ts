import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export interface AuthUser {
  id: string;
  email: string;
  organizationId: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

// Access token lives only in memory (never in localStorage) — the refresh
// token is an HttpOnly cookie managed by the backend.
let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const registerSessionExpiredHandler = (handler: () => void): void => {
  onSessionExpired = handler;
};

export const api = axios.create({
  baseURL: "/api/backend",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<AuthResponse | null> | null = null;

/** Exchanges the refresh cookie for a new access token (and user). */
export async function refreshSession(): Promise<AuthResponse | null> {
  try {
    const { data } = await axios.post<AuthResponse>(
      "/api/backend/auth/refresh",
      {},
      { withCredentials: true },
    );
    setAccessToken(data.accessToken);
    return data;
  } catch {
    setAccessToken(null);
    return null;
  }
}

// Transparently refresh the access token once on a 401, then retry the request.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const isAuthCall = original?.url?.includes("/auth/");

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthCall
    ) {
      original._retry = true;
      refreshPromise = refreshPromise ?? refreshSession();
      const result = await refreshPromise;
      refreshPromise = null;

      if (result) {
        original.headers.Authorization = `Bearer ${result.accessToken}`;
        return api(original);
      }
      onSessionExpired?.();
    }

    return Promise.reject(error);
  },
);
