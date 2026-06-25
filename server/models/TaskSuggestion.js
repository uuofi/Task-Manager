import mongoose from 'mongoose';

import {
  SUGGESTION_STATUS,
  SUGGESTION_STATUS_VALUES,
  TASK_PRIORITY,
  TASK_PRIORITY_VALUES,
} from '../constants/index.js';
import { toJSONPlugin } from '../utils/mongoose.js';

const { Schema, model } = mongoose;

const taskSuggestionSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    // Suggested target project (optional until accepted).
    project: { type: Schema.Types.ObjectId, ref: 'Project', default: null },

    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 5000, default: '' },
    priority: { type: String, enum: TASK_PRIORITY_VALUES, default: TASK_PRIORITY.MEDIUM },
    dueDate: { type: Date, default: null },

    suggestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    suggestedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    status: {
      type: String,
      enum: SUGGESTION_STATUS_VALUES,
      default: SUGGESTION_STATUS.PENDING,
      index: true,
    },
    responseNote: { type: String, maxlength: 500, default: '' },
    respondedAt: { type: Date, default: null },

    // Set when accepted and converted into a real task.
    resultingTask: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
  },
  { timestamps: true },
);

taskSuggestionSchema.index({ suggestedTo: 1, status: 1, createdAt: -1 });

taskSuggestionSchema.plugin(toJSONPlugin);

export const TaskSuggestion = model('TaskSuggestion', taskSuggestionSchema);

export default TaskSuggestion;
