import mongoose from 'mongoose';

import { ROLES, ROLE_VALUES } from '../constants/index.js';

const { Schema, model } = mongoose;

const memberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ROLE_VALUES, default: ROLES.MEMBER },
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

export const Workspace = model('Workspace', workspaceSchema);

export default Workspace;
