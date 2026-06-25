import mongoose from 'mongoose';

import {
  RECURRENCE,
  RECURRENCE_VALUES,
  TASK_PRIORITY,
  TASK_PRIORITY_VALUES,
  TASK_STATUS,
  TASK_STATUS_VALUES,
} from '../constants/index.js';
import { toJSONPlugin } from '../utils/mongoose.js';

const { Schema, model } = mongoose;

const checklistItemSchema = new Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 300 },
    done: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: true, timestamps: false },
);
// Expose `id` (not `_id`) on checklist items so clients can target them.
checklistItemSchema.plugin(toJSONPlugin);

const recurrenceSchema = new Schema(
  {
    frequency: { type: String, enum: RECURRENCE_VALUES, default: RECURRENCE.NONE },
    interval: { type: Number, default: 1, min: 1 }, // every N units
    until: { type: Date, default: null },
    nextRunAt: { type: Date, default: null },
  },
  { _id: false },
);

const taskSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },

    // Human-friendly identifier, e.g. ENG-42 (project key + sequential number).
    number: { type: Number, required: true },
    key: { type: String, required: true, index: true },

    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    description: { type: String, maxlength: 10000, default: '' },

    status: {
      type: String,
      enum: TASK_STATUS_VALUES,
      default: TASK_STATUS.BACKLOG,
      index: true,
    },
    priority: {
      type: String,
      enum: TASK_PRIORITY_VALUES,
      default: TASK_PRIORITY.MEDIUM,
      index: true,
    },

    tags: { type: [String], default: [], index: true },

    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    watchers: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },

    checklist: { type: [checklistItemSchema], default: [] },
    attachments: { type: [{ type: Schema.Types.ObjectId, ref: 'Attachment' }], default: [] },

    estimatedHours: { type: Number, default: 0, min: 0 },
    // Aggregated from TimeEntry records (seconds tracked / 3600).
    actualHours: { type: Number, default: 0, min: 0 },

    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null, index: true },
    completedAt: { type: Date, default: null },

    // Tasks that must be completed before this one (blockers).
    dependencies: { type: [{ type: Schema.Types.ObjectId, ref: 'Task' }], default: [] },

    recurrence: { type: recurrenceSchema, default: () => ({}) },

    // Fractional position for stable drag-and-drop ordering within a column.
    order: { type: Number, default: 0 },

    commentCount: { type: Number, default: 0 },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

// Common board / list query patterns.
taskSchema.index({ project: 1, status: 1, order: 1 });
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ workspace: 1, dueDate: 1 });
taskSchema.index({ project: 1, number: 1 }, { unique: true });
// Lightweight text search across title/description.
taskSchema.index({ title: 'text', description: 'text' });

taskSchema.virtual('isOverdue').get(function isOverdue() {
  if (!this.dueDate) return false;
  const open = this.status !== TASK_STATUS.DONE && this.status !== TASK_STATUS.CANCELLED;
  return open && this.dueDate.getTime() < Date.now();
});

taskSchema.virtual('isRecurring').get(function isRecurring() {
  return this.recurrence?.frequency && this.recurrence.frequency !== RECURRENCE.NONE;
});

taskSchema.plugin(toJSONPlugin);

export const Task = model('Task', taskSchema);

export default Task;
