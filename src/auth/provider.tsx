'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppRole } from '@/lib/roles';

export type AppUser = {
  id: string;
  fullName: string;
  email: string;
  role: AppRole;
};

type AuthContextValue = {
  user: AppUser | null;
  isUserLoading: boolean;
  userError: Error | null;
  refreshUser: () => Promise<AppUser | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  const refreshUser = useCallback(async () => {
    setIsUserLoading(true);
    try {
      const response = await fetch('/api/auth/me', {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      const body = (await response.json()) as { user?: AppUser | null; error?: string };
      if (!response.ok) {
        throw new Error(body.error || 'Unable to check your sign-in.');
      }
      setUser(body.user ?? null);
      setUserError(null);
      return body.user ?? null;
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Unable to check your sign-in.');
      setUser(null);
      setUserError(authError);
      return null;
    } finally {
      setIsUserLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
    const refresh = () => void refreshUser();
    window.addEventListener('aio-auth-changed', refresh);
    return () => window.removeEventListener('aio-auth-changed', refresh);
  }, [refreshUser]);

  const signOut = useCallback(async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(body.error || 'Unable to sign out.');
    setUser(null);
    setUserError(null);
  }, []);

  const value = useMemo(
    () => ({ user, isUserLoading, userError, refreshUser, signOut }),
    [user, isUserLoading, userError, refreshUser, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('Authentication hooks must be used within AuthProvider.');
  return context;
}

export function useUser() {
  const { user, isUserLoading, userError, refreshUser } = useAuthContext();
  return { user, isUserLoading, userError, refreshUser };
}

export function useAuth() {
  const { signOut } = useAuthContext();
  return { signOut };
}
