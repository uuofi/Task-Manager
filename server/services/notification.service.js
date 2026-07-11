import { logger } from '../config/logger.js';
import { notificationQueue } from '../queues/index.js';
import { notificationRepository } from '../repositories/notification.repository.js';

/**
 * Queues creation + realtime delivery of a notification for a single
 * recipient (the `notifications` worker does the DB write and socket emit —
 * see queues/workers.js). Skips self-notifications (you don't get notified
 * about your own actions).
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
  if (payload.actor && String(payload.actor) === String(payload.recipient)) return;

  try {
    await notificationQueue.add('notify', payload);
  } catch (err) {
    logger.warn(`Failed to queue notification (${payload.type}): ${err.message}`);
  }
};

/** Fan-out notification to many recipients (deduped, excludes the actor). */
const notifyMany = async (recipients, payload) => {
  const unique = [...new Set(recipients.map(String))].filter(
    (id) => !payload.actor || id !== String(payload.actor),
  );
  if (unique.length === 0) return;

  try {
    await notificationQueue.add('notify-many', { recipients: unique, payload });
  } catch (err) {
    logger.warn(`Failed to queue notification fan-out (${payload.type}): ${err.message}`);
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
