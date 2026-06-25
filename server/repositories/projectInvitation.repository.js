import { INVITATION_STATUS } from '../constants/index.js';
import { ProjectInvitation } from '../models/ProjectInvitation.js';

export const projectInvitationRepository = {
  create(data) {
    return ProjectInvitation.create(data);
  },

  findById(id) {
    return ProjectInvitation.findById(id);
  },

  findPendingByTokenHash(tokenHash) {
    return ProjectInvitation.findOne({ tokenHash, status: INVITATION_STATUS.PENDING });
  },

  findPendingByUserAndProject(userId, projectId) {
    return ProjectInvitation.findOne({
      user: userId,
      project: projectId,
      status: INVITATION_STATUS.PENDING,
    });
  },

  listPendingByProject(projectId) {
    return ProjectInvitation.find({ project: projectId, status: INVITATION_STATUS.PENDING })
      .sort('-createdAt')
      .populate('user', 'name email avatar')
      .populate('invitedBy', 'name avatar')
      .lean({ virtuals: true });
  },

  deleteById(id) {
    return ProjectInvitation.findByIdAndDelete(id);
  },
};

export default projectInvitationRepository;
