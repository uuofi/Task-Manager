import mongoose from 'mongoose';

import { toJSONPlugin } from '../utils/mongoose.js';

const { Schema, model } = mongoose;

/**
 * A user-created link between two projects ("contracts") in the Contract System
 * map. Links are undirected; `a`/`b` are stored in a stable (sorted) order so a
 * pair can only be linked once per workspace.
 */
const contractLinkSchema = new Schema(
  {
    workspace: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    a: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    b: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

// One link per unordered project pair within a workspace.
contractLinkSchema.index({ workspace: 1, a: 1, b: 1 }, { unique: true });

contractLinkSchema.plugin(toJSONPlugin);

export const ContractLink = model('ContractLink', contractLinkSchema);

export default ContractLink;
