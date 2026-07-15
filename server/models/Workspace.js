import mongoose from 'mongoose';

import { DEFAULT_MEMBER_PERMISSIONS, ROLES, ROLE_RANK, ROLE_VALUES } from '../constants/index.js';

const { Schema, model } = mongoose;

const memberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ROLE_VALUES, default: ROLES.MEMBER },
    // Fine-grained capabilities for `member`-rank users — ignored for
    // manager+ ranks, which always have every capability (see hasPermission).
    permissions: {
      canCreateTasks: { type: Boolean, default: DEFAULT_MEMBER_PERMISSIONS.canCreateTasks },
      canAssignTasks: { type: Boolean, default: DEFAULT_MEMBER_PERMISSIONS.canAssignTasks },
      canEditDeleteTasks: { type: Boolean, default: DEFAULT_MEMBER_PERMISSIONS.canEditDeleteTasks },
      canManageProjectMembers: {
        type: Boolean,
        default: DEFAULT_MEMBER_PERMISSIONS.canManageProjectMembers,
      },
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const workspaceSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: { type: String, maxlength: 280, default: '' },
    logo: { type: String, default: '' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: { type: [memberSchema], default: [] },
    settings: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

/** Returns the role of a given user within this workspace, or null. */
workspaceSchema.methods.getMemberRole = function getMemberRole(userId) {
  const member = this.members.find((m) => String(m.user) === String(userId));
  return member ? member.role : null;
};

workspaceSchema.methods.hasMember = function hasMember(userId) {
  return this.members.some((m) => String(m.user) === String(userId));
};

/** Returns the raw member subdocument (role + permissions) for a user, or null. */
workspaceSchema.methods.getMember = function getMember(userId) {
  return this.members.find((m) => String(m.user) === String(userId)) || null;
};

/**
 * True if the member outranks MANAGER (always allowed), or — for plain
 * members — has the specific capability flag set.
 */
workspaceSchema.methods.hasPermission = function hasPermission(userId, key) {
  const member = this.getMember(userId);
  if (!member) return false;
  if ((ROLE_RANK[member.role] ?? 0) >= ROLE_RANK[ROLES.MANAGER]) return true;
  return !!member.permissions?.[key];
};

export const Workspace = model('Workspace', workspaceSchema);

export default Workspace;
