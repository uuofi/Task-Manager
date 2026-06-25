import { create } from 'zustand';

/**
 * Global authentication state. The access token itself lives in memory inside
 * axiosClient (not here / not localStorage) to limit XSS exposure; this store
 * only tracks the resolved user and bootstrap status.
 */
export const useAuthStore = create((set) => ({
  user: null,
  workspaces: [],
  activeWorkspaceId: null,
  isAuthenticated: false,
  // 'pending' until the initial silent-refresh completes, then resolves.
  bootstrapStatus: 'pending',

  setAuth: (user) => set({ user, isAuthenticated: true }),

  setProfile: ({ user, workspaces }) =>
    set((state) => ({
      user,
      workspaces: workspaces ?? state.workspaces,
      activeWorkspaceId:
        state.activeWorkspaceId || workspaces?.[0]?.id || state.activeWorkspaceId,
      isAuthenticated: true,
    })),

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
}));

export default useAuthStore;
