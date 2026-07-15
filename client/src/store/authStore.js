import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Global authentication state. The access token itself lives in memory inside
 * axiosClient (not here / not localStorage) to limit XSS exposure; this store
 * only tracks the resolved user and bootstrap status. `activeWorkspaceId` is
 * persisted (via the `persist` middleware, localStorage) so a switch made in
 * the workspace picker survives page reloads.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      workspaces: [],
      activeWorkspaceId: null,
      isAuthenticated: false,
      // 'pending' until the initial silent-refresh completes, then resolves.
      bootstrapStatus: 'pending',

      setAuth: (user) => set({ user, isAuthenticated: true }),

      setProfile: ({ user, workspaces }) =>
        set((state) => {
          const list = workspaces ?? state.workspaces;
          // Keep the persisted active workspace only if the user is still a
          // member of it (e.g. they weren't removed since the last session).
          const stillValid = list.some((w) => w.id === state.activeWorkspaceId);
          return {
            user,
            workspaces: list,
            activeWorkspaceId: stillValid ? state.activeWorkspaceId : (list?.[0]?.id ?? null),
            isAuthenticated: true,
          };
        }),

      setActiveWorkspace: (workspaceId) => set({ activeWorkspaceId: workspaceId }),

      updateUser: (patch) => set((state) => ({ user: { ...state.user, ...patch } })),

      markBootstrapped: () => set({ bootstrapStatus: 'done' }),

      clearAuth: () =>
        set({
          user: null,
          workspaces: [],
          activeWorkspaceId: null,
          isAuthenticated: false,
          bootstrapStatus: 'done',
        }),
    }),
    {
      name: 'tc-auth-store',
      partialize: (state) => ({ activeWorkspaceId: state.activeWorkspaceId }),
    },
  ),
);

export default useAuthStore;
