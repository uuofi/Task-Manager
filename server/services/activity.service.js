import { logger } from '../config/logger.js';
import { activityRepository } from '../repositories/activity.repository.js';
import { realtime } from '../sockets/emitter.js';

/**
 * Records an audit-trail entry and broadcasts it to the relevant project room
 * so activity feeds update live. Failures are swallowed (logging must never
 * break the primary request).
 *
 * @param {object} entry
 * @param {string} entry.workspace
 * @param {string} [entry.project]
 * @param {string} [entry.task]
 * @param {string} entry.actor
 * @param {string} entry.action  one of ACTIVITY_ACTION
 * @param {string} entry.entityType  one of ENTITY_TYPE
 * @param {string} entry.entityId
 * @param {string} [entry.message]
 * @param {Array<{field:string, from:*, to:*}>} [entry.changes]
 */
const log = async (entry) => {
  try {
    const activity = await activityRepository.create(entry);
    const payload = activity.toJSON();
    if (entry.project) realtime.emitToProject(entry.project, 'activity:new', payload);
    realtime.emitToWorkspace(entry.workspace, 'activity:new', payload);
    return activity;
  } catch (err) {
    logger.warn(`Failed to record activity (${entry.action}): ${err.message}`);
    return null;
  }
};

const list = ({ workspace, project, task, pagination }) =>
  activityRepository.paginate({ workspace, project, task, ...pagination });

export const activityService = { log, list };

export default activityService;
