import { logger } from '../config/logger.js';

/**
 * Decouples services from Socket.IO. Services call `realtime.emitToUser(...)`
 * etc. without importing the io instance. Until `setIo` is called (Step 7),
 * these are safe no-ops, so the API works fully with or without realtime.
 *
 * Room conventions:
 *   - user room:      `user:<userId>`
 *   - project room:   `project:<projectId>`
 *   - workspace room: `workspace:<workspaceId>`
 */
let io = null;

export const realtime = {
  setIo(instance) {
    io = instance;
    logger.info('Realtime emitter attached to Socket.IO');
  },

  isReady() {
    return io !== null;
  },

  emitToUser(userId, event, payload) {
    io?.to(`user:${userId}`).emit(event, payload);
  },

  emitToProject(projectId, event, payload) {
    io?.to(`project:${projectId}`).emit(event, payload);
  },

  emitToWorkspace(workspaceId, event, payload) {
    io?.to(`workspace:${workspaceId}`).emit(event, payload);
  },

  /** Emit to several user rooms at once (e.g. task watchers). */
  emitToUsers(userIds = [], event, payload) {
    userIds.forEach((id) => io?.to(`user:${id}`).emit(event, payload));
  },
};

export default realtime;
