import mongoose from 'mongoose';

import { PROJECT_STATUS, PROJECT_STATUS_VALUES, ROLES, ROLE_VALUES } from '../constants/index.js';
import { toJSONPlugin } from '../utils/mongoose.js';

const { Schema, model } = mongoose;

const projectMemberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ROLE_VALUES, default: ROLES.MEMBER },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const projectSchema = new Schema(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    // Short uppercase code used to build task keys, e.g. "ENG" -> ENG-12.
    key: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 6,
    },
    description: { type: String, maxlength: 1000, default: '' },
    color: { type: String, default: '#5A3BFF' },
    icon: { type: String, default: 'folder' },

    status: {
      type: String,
      enum: PROJECT_STATUS_VALUES,
      default: PROJECT_STATUS.ACTIVE,
      index: true,
    },

    lead: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [projectMemberSchema], default: [] },

    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },

    // Running counter used to generate sequential task numbers per project.
    taskCounter: { type: Number, default: 0 },

    archivedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

// A project key must be unique within its workspace.
projectSchema.index({ workspace: 1, key: 1 }, { unique: true });
projectSchema.index({ workspace: 1, status: 1 });

projectSchema.virtual('isArchived').get(function isArchived() {
  return this.status === PROJECT_STATUS.ARCHIVED;
});

projectSchema.methods.getMemberRole = function getMemberRole(userId) {
  const member = this.members.find((m) => String(m.user) === String(userId));
  return member ? member.role : null;
};

projectSchema.plugin(toJSONPlugin);

export const Project = model('Project', projectSchema);

export default Project;
