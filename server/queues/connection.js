import Redis from 'ioredis';

import { env } from '../config/env.js';

/**
 * BullMQ requires its own Redis connection(s) with blocking-command-friendly
 * options (`maxRetriesPerRequest: null`) — it cannot share the connection
 * used by `cache.service.js`. Queues and workers each call this to get their
 * own client.
 */
export const createQueueConnection = () =>
  new Redis(env.redisUrl, { maxRetriesPerRequest: null });

export default createQueueConnection;
