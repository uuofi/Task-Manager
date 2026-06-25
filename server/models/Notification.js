import mongoose from 'mongoose';

import { ENTITY_TYPE, NOTIFICATION_TYPE_VALUES } from '../constants/index.js';
import { toJSONPlugin } from '../utils/mongoose.js';

const { Schema, model } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },

    type: { type: String, enum: NOTIFICATION_TYPE_VALUES, required: true },

    // Who triggered the notification (null for system events).
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    // Polymorphic target reference for deep-linking.
    entityType: { type: String, enum: Object.values(ENTITY_TYPE), default: null },
    entityId: { type: Schema.Types.ObjectId, default: null },

    project: { type: Schema.Types.ObjectId, ref: 'Project', default: null },
    task: { type: Schema.Types.ObjectId, ref: 'Task', default: null },

    title: { type: String, required: true },
    body: { type: String, default: '' },
    // Pre-computed client route for the "view" action.
    link: { type: String, default: '' },

    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Fast "my unread, newest first" queries.
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

notificationSchema.plugin(toJSONPlugin);

export const Notification = model('Notification', notificationSchema);

export default Notification;
