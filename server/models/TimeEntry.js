import mongoose from 'mongoose';

import { TIMER_STATUS, TIMER_STATUS_VALUES } from '../constants/index.js';
import { toJSONPlugin } from '../utils/mongoose.js';

const { Schema, model } = mongoose;

/**
 * A single time-tracking session for a task. Supports start / pause / resume /
 * stop by accumulating elapsed time across running segments:
 *
 *   - `accumulatedSeconds` holds time banked from previous segments.
 *   - `lastResumedAt` marks the start of the current running segment.
 *   - live duration = accumulatedSeconds + (now - lastResumedAt) while running.
 */
const timeEntrySchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    status: {
      type: String,
      enum: TIMER_STATUS_VALUES,
      default: TIMER_STATUS.RUNNING,
      index: true,
    },

    startedAt: { type: Date, required: true, default: Date.now },
    lastResumedAt: { type: Date, default: Date.now },
    accumulatedSeconds: { type: Number, default: 0, min: 0 },

    endedAt: { type: Date, default: null },
    // Final tracked duration once stopped (seconds).
    durationSeconds: { type: Number, default: 0, min: 0 },

    note: { type: String, maxlength: 500, default: '' },
  },
  { timestamps: true },
);

// At most one active (running/paused) timer per user per task.
timeEntrySchema.index(
  { user: 1, task: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: [TIMER_STATUS.RUNNING, TIMER_STATUS.PAUSED] } },
  },
);

/** Total elapsed seconds, accounting for an in-progress running segment. */
timeEntrySchema.methods.elapsedSeconds = function elapsedSeconds(now = Date.now()) {
  if (this.status === TIMER_STATUS.RUNNING && this.lastResumedAt) {
    return this.accumulatedSeconds + Math.floor((now - this.lastResumedAt.getTime()) / 1000);
  }
  return this.status === TIMER_STATUS.STOPPED ? this.durationSeconds : this.accumulatedSeconds;
};

timeEntrySchema.plugin(toJSONPlugin);

export const TimeEntry = model('TimeEntry', timeEntrySchema);

export default TimeEntry;
