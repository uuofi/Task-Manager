import { Server } from 'socket.io';

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { SOCKET_EVENTS } from '../constants/index.js';
import { Project } from '../models/Project.js';
import { Workspace } from '../models/Workspace.js';
import { userRepository } from '../repositories/user.repository.js';
import { verifyAccessToken } from '../utils/jwt.js';

import { realtime } from './emitter.js';

/**
 * Tracks live socket connections per user so presence reflects "any open tab".
 * userId -> Set<socketId>
 */
const presence = new Map();

const userRoom = (userId) => `user:${userId}`;
const workspaceRoom = (workspaceId) => `workspace:${workspaceId}`;
const projectRoom = (projectId) => `project:${projectId}`;

/**
 * Authenticates a socket handshake using the same access token as the REST API.
 * Rejects connections with an invalid/expired token or stale token version.
 */
const authenticateSocket = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Authentication required'));

    const decoded = verifyAccessToken(token);
    const user = await userRepository.findById(decoded.sub);
    if (!user || user.tokenVersion !== decoded.tokenVersion || !user.isActive) {
      return next(new Error('Invalid session'));
    }
    socket.user = { id: user.id, name: user.name, avatar: user.avatar };
    return next();
  } catch {
    return next(new Error('Authentication failed'));
  }
};

/**
 * Initializes the Socket.IO server, wires presence/rooms/typing, and connects
 * the realtime emitter so services can broadcast.
 *
 * @param {import('http').Server} httpServer
 */
export const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: env.corsOrigins, credentials: true },
    transports: ['websocket', 'polling'],
  });

  io.use(authenticateSocket);

  io.on(SOCKET_EVENTS.CONNECTION, async (socket) => {
    const { id: userId } = socket.user;

    // Personal room for notifications.
    socket.join(userRoom(userId));

    // Join every workspace the user belongs to (for workspace-wide events).
    const workspaces = await Workspace.find({ 'members.user': userId }).select('_id').lean();
    const workspaceIds = workspaces.map((w) => String(w._id));
    workspaceIds.forEach((wid) => socket.join(workspaceRoom(wid)));

    // Presence: mark online on first connection.
    if (!presence.has(userId)) presence.set(userId, new Set());
    const sockets = presence.get(userId);
    const wasOffline = sockets.size === 0;
    sockets.add(socket.id);

    if (wasOffline) {
      await userRepository.setOnlineStatus(userId, true);
      workspaceIds.forEach((wid) =>
        socket.to(workspaceRoom(wid)).emit(SOCKET_EVENTS.USER_ONLINE, { userId }),
      );
    }

    // Send the caller the current online roster across their workspaces.
    socket.emit(SOCKET_EVENTS.ONLINE_USERS, { online: [...presence.keys()] });

    // --- Project rooms (board/task views) ---
    socket.on(SOCKET_EVENTS.JOIN_PROJECT, async (projectId) => {
      const project = await Project.findById(projectId).select('workspace').lean();
      if (project && workspaceIds.includes(String(project.workspace))) {
        socket.join(projectRoom(projectId));
      }
    });

    socket.on(SOCKET_EVENTS.LEAVE_PROJECT, (projectId) => {
      socket.leave(projectRoom(projectId));
    });

    // --- Typing indicator (relayed to the project room) ---
    socket.on(SOCKET_EVENTS.TYPING_START, ({ projectId, taskId }) => {
      if (projectId) {
        socket.to(projectRoom(projectId)).emit(SOCKET_EVENTS.TYPING_START, {
          taskId,
          user: socket.user,
        });
      }
    });
    socket.on(SOCKET_EVENTS.TYPING_STOP, ({ projectId, taskId }) => {
      if (projectId) {
        socket.to(projectRoom(projectId)).emit(SOCKET_EVENTS.TYPING_STOP, {
          taskId,
          user: socket.user,
        });
      }
    });

    // --- Disconnect / presence cleanup ---
    socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
      const set = presence.get(userId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          presence.delete(userId);
          await userRepository.setOnlineStatus(userId, false);
          workspaceIds.forEach((wid) =>
            socket.to(workspaceRoom(wid)).emit(SOCKET_EVENTS.USER_OFFLINE, { userId }),
          );
        }
      }
    });
  });

  realtime.setIo(io);
  logger.info('Socket.IO server initialized');
  return io;
};

export default initSocketServer;
