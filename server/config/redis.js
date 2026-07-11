import Redis from 'ioredis';

import { env } from './env.js';
import { logger } from './logger.js';

/**
 * Shared Redis connection for caching (`cache.service.js`). BullMQ needs its
 * own connections with different options, so queues create theirs separately
 * (see `queues/connection.js`) rather than reusing this client.
 */
export const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error(`Redis connection error: ${err.message}`));

export default redis;
