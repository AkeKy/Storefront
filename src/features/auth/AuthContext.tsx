'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  AuthActionError,
  AuthActionResult,
  AuthStatus,
  LoginCredentials,
  RegistrationData,
  SessionUser,
} from './types';

type AuthContextValue = {
  status: AuthStatus;
  user?: SessionUser;
  isAdmin: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthActionResult>;
  register: (registration: RegistrationData) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

type PublicSessionResponse = {
  user?: unknown;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const nonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized || undefined;
};

const parseSessionUser = (value: unknown): SessionUser | undefined => {
  if (!isRecord(value)) return undefined;
  const memberId = value.member_id;
  const permissionId = value.permission_id;
  const username = nonEmptyString(value.username);
  const firstName = nonEmptyString(value.first_name);
  const permissionName = nonEmptyString(value.permission_name);
  if (
    typeof memberId !== 'number' ||
    !Number.isSafeInteger(memberId) ||
    (permissionId !== 1 && permissionId !== 2) ||
    !username ||
    !firstName ||
    !permissionName
  ) {
    return undefined;
  }
  const profileImage = nonEmptyString(value.profile_image);
  return {
    memberId,
    username,
    firstName,
    permissionId,
    permissionName,
    ...(profileImage ? { profileImage } : {}),
  };
};

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
};

const errorFor = (status: number, mode: 'login' | 'register'): AuthActionError => {
  if (mode === 'login' && status === 401) return 'invalidCredentials';
  if (mode === 'register' && status === 409) return 'accountConflict';
  if (status === 400) return 'invalidRequest';
  return 'unavailable';
};

const purgeLegacyBrowserToken = () => {
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      storage.removeItem('byteforge-token');
    } catch {
      // A restricted storage area must not prevent session restoration.
    }
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<SessionUser>();
  const mounted = useRef(false);
  const sessionRequest = useRef<AbortController | undefined>(undefined);
  const loginRequest = useRef<AbortController | undefined>(undefined);
  const generation = useRef(0);

  const invalidateAuthRequests = useCallback(() => {
    generation.current += 1;
    sessionRequest.current?.abort();
    sessionRequest.current = undefined;
    loginRequest.current?.abort();
    loginRequest.current = undefined;
    return generation.current;
  }, []);

  const refresh = useCallback(async () => {
    const requestGeneration = invalidateAuthRequests();
    const controller = new AbortController();
    sessionRequest.current = controller;
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'same-origin',
        signal: controller.signal,
      });
      const body = (await readJson(response)) as PublicSessionResponse | undefined;
      const nextUser = response.ok ? parseSessionUser(body?.user) : undefined;
      if (!mounted.current || requestGeneration !== generation.current) return;
      setUser(nextUser);
      setStatus(nextUser ? 'authenticated' : 'anonymous');
    } catch {
      if (!mounted.current || requestGeneration !== generation.current) return;
      setUser(undefined);
      setStatus('anonymous');
    } finally {
      if (sessionRequest.current === controller) sessionRequest.current = undefined;
    }
  }, [invalidateAuthRequests]);

  useEffect(() => {
    mounted.current = true;
    purgeLegacyBrowserToken();
    void refresh();
    return () => {
      mounted.current = false;
      invalidateAuthRequests();
    };
  }, [invalidateAuthRequests, refresh]);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthActionResult> => {
      const fallbackUser = user;
      const fallbackStatus: AuthStatus =
        status === 'authenticated' && fallbackUser ? 'authenticated' : 'anonymous';
      const requestGeneration = invalidateAuthRequests();
      const controller = new AbortController();
      loginRequest.current = controller;

      const reconcileFailedLogin = () => {
        if (!mounted.current || requestGeneration !== generation.current) return false;
        setUser(fallbackStatus === 'authenticated' ? fallbackUser : undefined);
        setStatus(fallbackStatus);
        return true;
      };

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials),
          signal: controller.signal,
        });
        const body = (await readJson(response)) as PublicSessionResponse | undefined;
        const nextUser = response.ok ? parseSessionUser(body?.user) : undefined;
        if (!mounted.current || requestGeneration !== generation.current)
          return { ok: false, error: 'unavailable' };
        if (!nextUser) {
          reconcileFailedLogin();
          return { ok: false, error: errorFor(response.status, 'login') };
        }
        setUser(nextUser);
        setStatus('authenticated');
        return { ok: true };
      } catch {
        reconcileFailedLogin();
        return { ok: false, error: 'unavailable' };
      } finally {
        if (loginRequest.current === controller) loginRequest.current = undefined;
      }
    },
    [invalidateAuthRequests, status, user]
  );

  const register = useCallback(
    async (registration: RegistrationData): Promise<AuthActionResult> => {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registration),
        });
        return response.ok
          ? { ok: true }
          : { ok: false, error: errorFor(response.status, 'register') };
      } catch {
        return { ok: false, error: 'unavailable' };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    invalidateAuthRequests();
    if (mounted.current) {
      setUser(undefined);
      setStatus('anonymous');
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      // Logout must remove the local session view even if the network is unavailable.
    }
  }, [invalidateAuthRequests]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isAdmin: user?.permissionId === 1,
      login,
      register,
      logout,
      refresh,
    }),
    [login, logout, refresh, register, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider.');
  return context;
}
