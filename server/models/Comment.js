import mongoose from 'mongoose';

import { toJSONPlugin } from '../utils/mongoose.js';

const { Schema, model } = mongoose;

const reactionSchema = new Schema(
  {
    emoji: { type: String, required: true },
    users: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
  },
  { _id: false },
);

const commentSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },

    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    body: { type: String, required: true, trim: true, maxlength: 5000 },

    // Self-reference enables threaded / nested replies.
    parent: { type: Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },

    mentions: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    attachments: { type: [{ type: Schema.Types.ObjectId, ref: 'Attachment' }], default: [] },
    reactions: { type: [reactionSchema], default: [] },

    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },

    // Soft delete preserves thread structure for replies.
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

commentSchema.index({ task: 1, createdAt: 1 });

commentSchema.plugin(toJSONPlugin);

export const Comment = model('Comment', commentSchema);

export default Comment;
