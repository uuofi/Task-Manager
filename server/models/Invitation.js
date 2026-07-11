import mongoose from 'mongoose';

import {
  INVITATION_STATUS,
  INVITATION_STATUS_VALUES,
  ROLES,
  ROLE_VALUES,
} from '../constants/index.js';
import { toJSONPlugin } from '../utils/mongoose.js';

const { Schema, model } = mongoose;

const invitationSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    // Optional: invite directly into a project as well.
    project: { type: Schema.Types.ObjectId, ref: 'Project', default: null },

    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: { type: String, enum: ROLE_VALUES, default: ROLES.MEMBER },

    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    expiresAt: { type: Date, required: true },

    status: {
      type: String,
      enum: INVITATION_STATUS_VALUES,
      default: INVITATION_STATUS.PENDING,
      index: true,
    },
    acceptedAt: { type: Date, default: null },
    acceptedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

// Prevent duplicate pending invites for the same email + workspace.
invitationSchema.index(
  { workspace: 1, email: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: INVITATION_STATUS.PENDING } },
);

invitationSchema.virtual('isExpired').get(function isExpired() {
  return this.expiresAt.getTime() < Date.now();
});

invitationSchema.plugin(toJSONPlugin);

export const Invitation = model('Invitation', invitationSchema);

export default Invitation;
