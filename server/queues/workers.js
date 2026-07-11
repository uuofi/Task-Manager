import { Worker } from 'bullmq';

import { logger } from '../config/logger.js';
import { SOCKET_EVENTS } from '../constants/index.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { sendProjectInvitationEmail, sendWorkspaceInviteNotificationEmail } from '../services/email.service.js';
import { realtime } from '../sockets/emitter.js';

import { createQueueConnection } from './connection.js';

/**
 * Job processors. Kept separate from `services/*.service.js` (which only
 * enqueue) to avoid a service <-> queue import cycle: services push jobs
 * here, workers do the actual DB write / email send.
 */

const invitationWorker = new Worker(
  'invitations',
  async (job) => {
    if (job.name === 'workspace-invite-email') {
      return sendWorkspaceInviteNotificationEmail(job.data);
    }
    if (job.name === 'project-invite-email') {
      return sendProjectInvitationEmail(job.data);
    }
    logger.warn(`[queue:invitations] unknown job name "${job.name}"`);
  },
  { connection: createQueueConnection() },
);

const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    if (job.name === 'notify') {
      const notification = await notificationRepository.create(job.data);
      realtime.emitToUser(job.data.recipient, SOCKET_EVENTS.NOTIFICATION_NEW, notification.toJSON());
      return;
    }
    if (job.name === 'notify-many') {
      const { recipients, payload } = job.data;
      const docs = recipients.map((recipient) => ({ ...payload, recipient }));
      const created = await notificationRepository.insertMany(docs);
      created.forEach((n) => realtime.emitToUser(n.recipient, SOCKET_EVENTS.NOTIFICATION_NEW, n.toJSON()));
      return;
    }
    logger.warn(`[queue:notifications] unknown job name "${job.name}"`);
  },
  { connection: createQueueConnection() },
);

[invitationWorker, notificationWorker].forEach((worker) => {
  worker.on('ready', () => logger.info(`[queue:${worker.name}] worker ready`));
  worker.on('failed', (job, err) =>
    logger.error(`[queue:${worker.name}] job "${job?.name}" failed: ${err.message}`),
  );
});

export const closeWorkers = () =>
  Promise.all([invitationWorker.close(), notificationWorker.close()]);

export default { invitationWorker, notificationWorker, closeWorkers };
