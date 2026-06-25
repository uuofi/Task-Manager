import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { authApi } from '@/api/auth.api';
import { getErrorMessage } from '@/api/axiosClient';
import { invitationsApi, notificationsApi } from '@/api/misc.api';
import { connectSocket, getSocket } from '@/lib/socket';
import { qk } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

export function useNotifications(params = {}) {
  return useQuery({
    queryKey: qk.notifications(params),
    queryFn: () => notificationsApi.list(params),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: qk.unreadCount,
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 60_000,
  });
}

export function useNotificationActions() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markRead = useMutation({ mutationFn: notificationsApi.markRead, onSuccess: invalidate });
  const markAllRead = useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: notificationsApi.remove, onSuccess: invalidate });

  return { markRead, markAllRead, remove };
}

export function useRespondToInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ notificationId, invitationId, action }) =>
      Promise.all([
        invitationsApi.respond(invitationId, action),
        notificationsApi.markRead(notificationId),
      ]),
    onSuccess: async (_, { action }) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['workspace'] });
      qc.invalidateQueries({ queryKey: ['invitations'] });

      if (action === 'accept') {
        toast.success('You have joined the workspace!');
        // Refresh auth store so the new workspace appears in the sidebar
        try {
          const profile = await authApi.me();
          useAuthStore.getState().setProfile(profile);
        } catch {
          // ignore — socket WORKSPACE_JOINED event will handle it
        }
        // Reconnect socket to join the new workspace room
        const s = getSocket();
        s.disconnect();
        setTimeout(() => connectSocket(), 300);
      } else {
        toast.info('Invitation declined');
      }
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
