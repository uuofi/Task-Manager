import { INVITATION_STATUS } from '../constants/index.js';
import { Invitation } from '../models/Invitation.js';

export const invitationRepository = {
  create(data) {
    return Invitation.create(data);
  },

  findById(id) {
    return Invitation.findById(id);
  },

  findPendingByEmail(workspace, email) {
    return Invitation.findOne({ workspace, email, status: INVITATION_STATUS.PENDING });
  },

  listPending(workspace) {
    return Invitation.find({ workspace, status: INVITATION_STATUS.PENDING })
      .sort('-createdAt')
      .populate('invitedBy', 'name avatar')
      .lean({ virtuals: true });
  },

  deleteById(id) {
    return Invitation.findByIdAndDelete(id);
  },
};

export default invitationRepository;
