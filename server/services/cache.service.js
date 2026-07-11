import { logger } from '../config/logger.js';
import { redis } from '../config/redis.js';

/**
 * Read-through cache around Redis. Reads never throw — a Redis hiccup should
 * degrade to "always hit the database", not take the API down.
 */
const get = async (key) => {
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    logger.warn(`[cache] get failed for "${key}": ${err.message}`);
    return null;
  }
};

const set = async (key, value, ttlSeconds) => {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn(`[cache] set failed for "${key}": ${err.message}`);
  }
};

/** Returns the cached value for `key`, or computes it via `fn` and caches it for `ttlSeconds`. */
const getOrSet = async (key, ttlSeconds, fn) => {
  const cached = await get(key);
  if (cached !== null) return cached;
  const fresh = await fn();
  await set(key, fresh, ttlSeconds);
  return fresh;
};

/**
 * Per-workspace version counter used to invalidate every cached task list /
 * dashboard entry for that workspace in one write, without tracking or
 * scanning individual keys (cache keys embed the version; bumping it just
 * makes old keys unreachable — they expire on their own via TTL).
 */
const taskVersion = async (workspaceId) => {
  const v = await redis.get(`tasks:version:${workspaceId}`);
  return v || '0';
};

const bumpTaskVersion = async (workspaceId) => {
  try {
    await redis.incr(`tasks:version:${workspaceId}`);
  } catch (err) {
    logger.warn(`[cache] bumpTaskVersion failed for "${workspaceId}": ${err.message}`);
  }
};

export const cacheService = { get, set, getOrSet, taskVersion, bumpTaskVersion };

export default cacheService;
