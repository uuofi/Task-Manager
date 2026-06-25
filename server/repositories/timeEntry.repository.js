import { TIMER_STATUS } from '../constants/index.js';
import { TimeEntry } from '../models/TimeEntry.js';

export const timeEntryRepository = {
  create(data) {
    return TimeEntry.create(data);
  },

  findById(id) {
    return TimeEntry.findById(id);
  },

  /** The user's current running/paused timer for a task, if any. */
  findActive(userId, taskId) {
    return TimeEntry.findOne({
      user: userId,
      task: taskId,
      status: { $in: [TIMER_STATUS.RUNNING, TIMER_STATUS.PAUSED] },
    });
  },

  /** Any active timer for the user, across tasks. */
  findAnyActive(userId) {
    return TimeEntry.findOne({
      user: userId,
      status: { $in: [TIMER_STATUS.RUNNING, TIMER_STATUS.PAUSED] },
    }).populate('task', 'title key');
  },

  listByTask(taskId) {
    return TimeEntry.find({ task: taskId })
      .sort('-createdAt')
      .populate('user', 'name avatar')
      .lean({ virtuals: true });
  },

  /** Total stopped seconds logged on a task. */
  async totalSeconds(taskId) {
    const rows = await TimeEntry.aggregate([
      { $match: { task: taskId, status: TIMER_STATUS.STOPPED } },
      { $group: { _id: null, total: { $sum: '$durationSeconds' } } },
    ]);
    return rows[0]?.total ?? 0;
  },
};

export default timeEntryRepository;
