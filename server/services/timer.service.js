import { TIMER_STATUS } from '../constants/index.js';
import { taskRepository } from '../repositories/task.repository.js';
import { timeEntryRepository } from '../repositories/timeEntry.repository.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Starts a timer for the current user on a task. Enforces a single active timer
 * per user (across tasks) so tracked time is unambiguous.
 */
const start = async ({ task, user }) => {
  const existingOnTask = await timeEntryRepository.findActive(user.id, task.id);
  if (existingOnTask) {
    throw ApiError.conflict('A timer is already running for this task');
  }
  const anyActive = await timeEntryRepository.findAnyActive(user.id);
  if (anyActive) {
    throw ApiError.conflict(
      `Stop your active timer on "${anyActive.task?.title ?? 'another task'}" first`,
    );
  }

  const now = new Date();
  return timeEntryRepository.create({
    workspace: task.workspace,
    project: task.project,
    task: task.id,
    user: user.id,
    status: TIMER_STATUS.RUNNING,
    startedAt: now,
    lastResumedAt: now,
    accumulatedSeconds: 0,
  });
};

const pause = async ({ task, user }) => {
  const entry = await timeEntryRepository.findActive(user.id, task.id);
  if (!entry) throw ApiError.notFound('No active timer for this task');
  if (entry.status === TIMER_STATUS.PAUSED) return entry;

  entry.accumulatedSeconds = entry.elapsedSeconds();
  entry.status = TIMER_STATUS.PAUSED;
  entry.lastResumedAt = null;
  await entry.save();
  return entry;
};

const resume = async ({ task, user }) => {
  const entry = await timeEntryRepository.findActive(user.id, task.id);
  if (!entry) throw ApiError.notFound('No paused timer for this task');
  if (entry.status === TIMER_STATUS.RUNNING) return entry;

  entry.status = TIMER_STATUS.RUNNING;
  entry.lastResumedAt = new Date();
  await entry.save();
  return entry;
};

/** Stops the timer, finalizes duration, and rolls it up into task.actualHours. */
const stop = async ({ task, user }) => {
  const entry = await timeEntryRepository.findActive(user.id, task.id);
  if (!entry) throw ApiError.notFound('No active timer for this task');

  const total = entry.elapsedSeconds();
  entry.accumulatedSeconds = total;
  entry.durationSeconds = total;
  entry.status = TIMER_STATUS.STOPPED;
  entry.endedAt = new Date();
  entry.lastResumedAt = null;
  await entry.save();

  // Recompute the task's actual hours from all stopped entries (authoritative).
  const totalSeconds = await timeEntryRepository.totalSeconds(task.id);
  await taskRepository.updateById(task.id, {
    actualHours: Math.round((totalSeconds / 3600) * 100) / 100,
  });

  return entry;
};

const getActive = async ({ task, user }) => {
  const entry = await timeEntryRepository.findActive(user.id, task.id);
  if (!entry) return null;
  return { ...entry.toJSON(), elapsedSeconds: entry.elapsedSeconds() };
};

const listForTask = (taskId) => timeEntryRepository.listByTask(taskId);

export const timerService = { start, pause, resume, stop, getActive, listForTask };

export default timerService;
