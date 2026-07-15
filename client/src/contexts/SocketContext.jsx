import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { authApi } from '@/api/auth.api';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { SOCKET_EVENTS } from '@/lib/socketEvents';
import { qk } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';

const SocketContext = createContext(undefined);

/**
 * Connects the realtime socket once the user is authenticated and translates
 * server events into React Query cache invalidations, toasts and presence state.
 */
export function SocketProvider({ children }) {
  const qc = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const bootstrapStatus = useAuthStore((s) => s.bootstrapStatus);
  const [onlineUsers, setOnlineUsers] = useState(() => new Set());
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || bootstrapStatus !== 'done') return undefined;

    const setProfile = useAuthStore.getState().setProfile;
    const socket = connectSocket();
    setSocket(socket);

    const onOnlineList = ({ online }) => setOnlineUsers(new Set(online));
    const onUserOnline = ({ userId }) =>
      setOnlineUsers((prev) => new Set(prev).add(userId));
    const onUserOffline = ({ userId }) =>
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });

    const onNotification = (notification) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast(notification.title, { description: notification.body });
    };

    const invalidateBoard = () => qc.invalidateQueries({ queryKey: ['board'] });
    const onTaskEvent = (task) => {
      invalidateBoard();
      if (task?.id) qc.invalidateQueries({ queryKey: qk.task(task.id) });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    };
    const onCommentEvent = (comment) => {
      if (comment?.task) qc.invalidateQueries({ queryKey: qk.comments(comment.task) });
    };

    // Refresh team list when a new member joins the workspace (received by existing members)
    const onMemberJoined = () => {
      qc.invalidateQueries({ queryKey: ['workspace', 'members'] });
    };

    // Received by the invitee after accepting: refresh profile + reconnect socket to join new workspace room
    const onWorkspaceJoined = () => {
      authApi.me().then((profile) => {
        setProfile(profile);
        // Reconnect so the socket joins the new workspace room on the server
        const s = getSocket();
        s.disconnect();
        setTimeout(() => s.connect(), 200);
      });
    };

    // Received by a user just added to a project (directly, or via an accepted
    // invitation scoped to a project): refresh their projects list so it shows up.
    const onProjectMemberAdded = () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    };

    socket.on(SOCKET_EVENTS.ONLINE_USERS, onOnlineList);
    socket.on(SOCKET_EVENTS.USER_ONLINE, onUserOnline);
    socket.on(SOCKET_EVENTS.USER_OFFLINE, onUserOffline);
    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, onNotification);
    socket.on(SOCKET_EVENTS.TASK_CREATED, onTaskEvent);
    socket.on(SOCKET_EVENTS.TASK_UPDATED, onTaskEvent);
    socket.on(SOCKET_EVENTS.TASK_DELETED, invalidateBoard);
    socket.on(SOCKET_EVENTS.COMMENT_CREATED, onCommentEvent);
    socket.on(SOCKET_EVENTS.COMMENT_UPDATED, onCommentEvent);
    socket.on(SOCKET_EVENTS.COMMENT_DELETED, onCommentEvent);
    socket.on(SOCKET_EVENTS.WORKSPACE_MEMBER_JOINED, onMemberJoined);
    socket.on(SOCKET_EVENTS.WORKSPACE_JOINED, onWorkspaceJoined);
    socket.on(SOCKET_EVENTS.PROJECT_MEMBER_ADDED, onProjectMemberAdded);

    return () => {
      socket.off(SOCKET_EVENTS.ONLINE_USERS, onOnlineList);
      socket.off(SOCKET_EVENTS.USER_ONLINE, onUserOnline);
      socket.off(SOCKET_EVENTS.USER_OFFLINE, onUserOffline);
      socket.off(SOCKET_EVENTS.NOTIFICATION_NEW, onNotification);
      socket.off(SOCKET_EVENTS.TASK_CREATED, onTaskEvent);
      socket.off(SOCKET_EVENTS.TASK_UPDATED, onTaskEvent);
      socket.off(SOCKET_EVENTS.TASK_DELETED, invalidateBoard);
      socket.off(SOCKET_EVENTS.COMMENT_CREATED, onCommentEvent);
      socket.off(SOCKET_EVENTS.COMMENT_UPDATED, onCommentEvent);
      socket.off(SOCKET_EVENTS.COMMENT_DELETED, onCommentEvent);
      socket.off(SOCKET_EVENTS.WORKSPACE_MEMBER_JOINED, onMemberJoined);
      socket.off(SOCKET_EVENTS.WORKSPACE_JOINED, onWorkspaceJoined);
      socket.off(SOCKET_EVENTS.PROJECT_MEMBER_ADDED, onProjectMemberAdded);
      disconnectSocket();
      setSocket(null);
      setOnlineUsers(new Set());
    };
  }, [isAuthenticated, bootstrapStatus, qc]);

  const joinProject = useCallback((projectId) => {
    if (projectId) getSocket().emit(SOCKET_EVENTS.JOIN_PROJECT, projectId);
  }, []);
  const leaveProject = useCallback((projectId) => {
    if (projectId) getSocket().emit(SOCKET_EVENTS.LEAVE_PROJECT, projectId);
  }, []);
  const emitTyping = useCallback((start, payload) => {
    getSocket().emit(start ? SOCKET_EVENTS.TYPING_START : SOCKET_EVENTS.TYPING_STOP, payload);
  }, []);

  const value = useMemo(
    () => ({
      socket,
      onlineUsers,
      isUserOnline: (id) => onlineUsers.has(id),
      joinProject,
      leaveProject,
      emitTyping,
    }),
    [socket, onlineUsers, joinProject, leaveProject, emitTyping],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
}
