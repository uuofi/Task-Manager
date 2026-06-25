import mongoose from 'mongoose';

import {
  INVITATION_STATUS,
  INVITATION_STATUS_VALUES,
  ROLES,
  ROLE_VALUES,
} from '../constants/index.js';
import { toJSONPlugin } from '../utils/mongoose.js';

const { Schema, model } = mongoose;

const projectInvitationSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },

    // The invited user (must already be a workspace member).
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ROLE_VALUES, default: ROLES.MEMBER },

    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    // Only the SHA-256 hash of the token is persisted.
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },

    status: {
      type: String,
      enum: INVITATION_STATUS_VALUES,
      default: INVITATION_STATUS.PENDING,
      index: true,
    },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// One pending invitation per user per project at a time.
projectInvitationSchema.index(
  { project: 1, user: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: INVITATION_STATUS.PENDING } },
);

projectInvitationSchema.virtual('isExpired').get(function isExpired() {
  return this.expiresAt.getTime() < Date.now();
});

projectInvitationSchema.plugin(toJSONPlugin);

export const ProjectInvitation = model('ProjectInvitation', projectInvitationSchema);

export default ProjectInvitation;
