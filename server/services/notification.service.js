import { logger } from '../config/logger.js';
import { SOCKET_EVENTS } from '../constants/index.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { realtime } from '../sockets/emitter.js';

/**
 * Creates a notification for a single recipient and pushes it in realtime.
 * Skips self-notifications (you don't get notified about your own actions).
 *
 * @param {object} payload
 * @param {string} payload.recipient
 * @param {string} payload.workspace
 * @param {string} payload.type           one of NOTIFICATION_TYPE
 * @param {string} [payload.actor]
 * @param {string} payload.title
 * @param {string} [payload.body]
 * @param {string} [payload.link]
 * @param {string} [payload.entityType]
 * @param {string} [payload.entityId]
 * @param {string} [payload.project]
 * @param {string} [payload.task]
 */
const notify = async (payload) => {
  if (payload.actor && String(payload.actor) === String(payload.recipient)) return null;

  try {
    const notification = await notificationRepository.create(payload);
    const data = notification.toJSON();
    realtime.emitToUser(payload.recipient, SOCKET_EVENTS.NOTIFICATION_NEW, data);
    return notification;
  } catch (err) {
    logger.warn(`Failed to create notification (${payload.type}): ${err.message}`);
    return null;
  }
};

/** Fan-out notification to many recipients (deduped, excludes the actor). */
const notifyMany = async (recipients, payload) => {
  const unique = [...new Set(recipients.map(String))].filter(
    (id) => !payload.actor || id !== String(payload.actor),
  );
  if (unique.length === 0) return;

  const docs = unique.map((recipient) => ({ ...payload, recipient }));
  try {
    const created = await notificationRepository.insertMany(docs);
    created.forEach((n) =>
      realtime.emitToUser(n.recipient, SOCKET_EVENTS.NOTIFICATION_NEW, n.toJSON()),
    );
  } catch (err) {
    logger.warn(`Failed to fan-out notifications (${payload.type}): ${err.message}`);
  }
};

const list = ({ recipient, unreadOnly, pagination }) =>
  notificationRepository.paginate({ recipient, unreadOnly, ...pagination });

const markRead = (id, recipient) => notificationRepository.markRead(id, recipient);
const markAllRead = (recipient) => notificationRepository.markAllRead(recipient);
const remove = (id, recipient) => notificationRepository.remove(id, recipient);
const countUnread = (recipient) => notificationRepository.countUnread(recipient);

export const notificationService = {
  notify,
  notifyMany,
  list,
  markRead,
  markAllRead,
  remove,
  countUnread,
};

export default notificationService;
