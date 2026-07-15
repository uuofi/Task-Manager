import { Workspace } from '../models/Workspace.js';

/**
 * Data-access layer for workspaces.
 */
export const workspaceRepository = {
  create(data) {
    return Workspace.create(data);
  },

  findById(id) {
    return Workspace.findById(id);
  },

  findBySlug(slug) {
    return Workspace.findOne({ slug });
  },

  existsBySlug(slug) {
    return Workspace.exists({ slug });
  },

  /** All workspaces the user belongs to, with member profiles populated. */
  findByMember(userId) {
    return Workspace.find({ 'members.user': userId })
      .sort({ createdAt: 1 })
      .populate('members.user', 'name avatar email');
  },

  updateById(id, update) {
    return Workspace.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  },
};

export default workspaceRepository;
