import { Queue } from 'bullmq';

import { createQueueConnection } from './connection.js';

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: { age: 3600 },
  removeOnFail: { age: 86400 },
};

/** Sends invitation emails (workspace + project) outside the request/response cycle. */
export const invitationQueue = new Queue('invitations', {
  connection: createQueueConnection(),
  defaultJobOptions,
});

/** Creates + fans out in-app notifications (DB write + realtime emit). */
export const notificationQueue = new Queue('notifications', {
  connection: createQueueConnection(),
  defaultJobOptions,
});

export default { invitationQueue, notificationQueue };
