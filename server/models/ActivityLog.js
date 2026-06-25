import mongoose from 'mongoose';

import { ACTIVITY_ACTION, ENTITY_TYPE } from '../constants/index.js';
import { toJSONPlugin } from '../utils/mongoose.js';

const { Schema, model } = mongoose;

const changeSchema = new Schema(
  {
    field: { type: String, required: true },
    from: { type: Schema.Types.Mixed, default: null },
    to: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false },
);

const activityLogSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task', default: null, index: true },

    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: Object.values(ACTIVITY_ACTION), required: true },

    entityType: { type: String, enum: Object.values(ENTITY_TYPE), required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },

    // Human-readable summary, e.g. "moved task from Todo to In Progress".
    message: { type: String, default: '' },
    // Field-level diff for audit detail.
    changes: { type: [changeSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activityLogSchema.index({ workspace: 1, createdAt: -1 });
activityLogSchema.index({ task: 1, createdAt: -1 });

activityLogSchema.plugin(toJSONPlugin);

export const ActivityLog = model('ActivityLog', activityLogSchema);

export default ActivityLog;
