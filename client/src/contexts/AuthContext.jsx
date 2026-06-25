import { createContext, useContext, useEffect, useMemo, useRef } from 'react';

import { authApi } from '@/api/auth.api';
import { setAccessToken, setUnauthorizedHandler } from '@/api/axiosClient';
import { useAuthStore } from '@/store/authStore';

const AuthContext = createContext(undefined);

/**
 * Bootstraps authentication on app load via a silent refresh (the access token
 * is in-memory only, so a page reload re-derives it from the httpOnly refresh
 * cookie). Exposes auth actions that keep the access token + store in sync.
 */
export function AuthProvider({ children }) {
  const { setAuth, setProfile, clearAuth, markBootstrapped } = useAuthStore();
  const didBootstrap = useRef(false);

  useEffect(() => {
    // Force a clean logout state when a refresh ultimately fails.
    setUnauthorizedHandler(() => {
      setAccessToken(null);
      clearAuth();
    });

    if (didBootstrap.current) return;
    didBootstrap.current = true;

    (async () => {
      try {
        const { accessToken } = await authApi.refresh();
        setAccessToken(accessToken);
        const profile = await authApi.me();
        setProfile(profile);
      } catch {
        setAccessToken(null);
        clearAuth();
      } finally {
        markBootstrapped();
      }
    })();
  }, [setProfile, clearAuth, markBootstrapped]);

  const actions = useMemo(
    () => ({
      async login(credentials) {
        const { user, accessToken } = await authApi.login(credentials);
        setAccessToken(accessToken);
        setAuth(user);
        const profile = await authApi.me();
        setProfile(profile);
        return user;
      },

      async register(payload) {
        const { user, accessToken } = await authApi.register(payload);
        setAccessToken(accessToken);
        setAuth(user);
        const profile = await authApi.me();
        setProfile(profile);
        return user;
      },

      async logout() {
        try {
          await authApi.logout();
        } finally {
          setAccessToken(null);
          clearAuth();
        }
      },

      forgotPassword: (email) => authApi.forgotPassword(email),
      resetPassword: (payload) => authApi.resetPassword(payload),
    }),
    [setAuth, setProfile, clearAuth],
  );

  return <AuthContext.Provider value={actions}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthActions() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthActions must be used within an AuthProvider');
  return ctx;
}
