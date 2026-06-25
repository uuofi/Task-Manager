import { Comment } from '../models/Comment.js';

const AUTHOR_POPULATE = { path: 'author', select: 'name avatar email' };
const MENTION_POPULATE = { path: 'mentions', select: 'name avatar' };

export const commentRepository = {
  create(data) {
    return Comment.create(data);
  },

  findById(id) {
    return Comment.findById(id);
  },

  findByIdPopulated(id) {
    return Comment.findById(id)
      .populate(AUTHOR_POPULATE)
      .populate(MENTION_POPULATE)
      .populate('attachments');
  },

  /** All comments for a task (flat); the client assembles the thread tree. */
  listByTask(taskId) {
    return Comment.find({ task: taskId })
      .sort('createdAt')
      .populate(AUTHOR_POPULATE)
      .populate(MENTION_POPULATE)
      .populate('attachments')
      .lean({ virtuals: true });
  },

  countByTask(taskId) {
    return Comment.countDocuments({ task: taskId, isDeleted: false });
  },

  /** Direct update (validators off) — used for soft-delete which blanks body. */
  updateById(id, update) {
    return Comment.findByIdAndUpdate(id, update, { new: true });
  },
};

export default commentRepository;
