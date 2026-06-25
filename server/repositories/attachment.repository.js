import { Attachment } from '../models/Attachment.js';

export const attachmentRepository = {
  create(data) {
    return Attachment.create(data);
  },

  findById(id) {
    return Attachment.findById(id);
  },

  listByTask(taskId) {
    return Attachment.find({ task: taskId })
      .sort('-createdAt')
      .populate('uploadedBy', 'name avatar')
      .lean({ virtuals: true });
  },

  deleteById(id) {
    return Attachment.findByIdAndDelete(id);
  },
};

export default attachmentRepository;
