import mongoose from 'mongoose';

import { TASK_STATUS } from '../constants/index.js';
import { Task } from '../models/Task.js';

const POPULATE = [
  { path: 'assignee', select: 'name avatar email' },
  { path: 'reporter', select: 'name avatar email' },
  { path: 'createdBy', select: 'name avatar' },
  { path: 'project', select: 'name key color' },
];

/** Translates a filter DTO into a Mongoose query object. */
const buildFilter = (filters = {}) => {
  const query = {};
  if (filters.workspace) query.workspace = filters.workspace;
  if (filters.project) query.project = filters.project;
  if (filters.status) query.status = Array.isArray(filters.status) ? { $in: filters.status } : filters.status;
  if (filters.priority)
    query.priority = Array.isArray(filters.priority) ? { $in: filters.priority } : filters.priority;
  if (filters.assignee) query.assignee = filters.assignee;
  if (filters.reporter) query.reporter = filters.reporter;
  if (filters.tags?.length) query.tags = { $in: filters.tags };
  if (filters.search) query.$text = { $search: filters.search };

  if (filters.dueBefore || filters.dueAfter) {
    query.dueDate = {};
    if (filters.dueAfter) query.dueDate.$gte = filters.dueAfter;
    if (filters.dueBefore) query.dueDate.$lte = filters.dueBefore;
  }

  if (filters.overdue) {
    query.dueDate = { ...(query.dueDate || {}), $lt: new Date() };
    query.status = { $nin: [TASK_STATUS.DONE, TASK_STATUS.CANCELLED] };
  }

  if (filters.createdAfter || filters.createdBefore) {
    query.createdAt = {};
    if (filters.createdAfter) query.createdAt.$gte = new Date(filters.createdAfter);
    if (filters.createdBefore) query.createdAt.$lte = new Date(filters.createdBefore);
  }

  return query;
};

export const taskRepository = {
  create(data) {
    return Task.create(data);
  },

  findById(id) {
    return Task.findById(id);
  },

  findByIdPopulated(id) {
    return Task.findById(id)
      .populate(POPULATE)
      .populate({ path: 'dependencies', select: 'title key status' })
      .populate({ path: 'attachments' });
  },

  async paginate({ filters, skip, limit, sort }) {
    const query = buildFilter(filters);
    const [items, total] = await Promise.all([
      Task.find(query).sort(sort).skip(skip).limit(limit).populate(POPULATE).lean({ virtuals: true }),
      Task.countDocuments(query),
    ]);
    return { items, total };
  },

  /** All tasks for a project (for board view), ordered within columns. */
  board(projectId) {
    return Task.find({ project: projectId })
      .sort({ status: 1, order: 1 })
      .populate(POPULATE)
      .lean({ virtuals: true });
  },

  updateById(id, update) {
    return Task.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  },

  delete(id) {
    return Task.findByIdAndDelete(id);
  },

  incrementCommentCount(id, delta) {
    return Task.findByIdAndUpdate(id, { $inc: { commentCount: delta } });
  },

  /** Per-assignee task totals + completed counts within a workspace. */
  async assigneeStats(workspaceId) {
    const rows = await Task.aggregate([
      { $match: { workspace: new mongoose.Types.ObjectId(String(workspaceId)), assignee: { $ne: null } } },
      {
        $group: {
          _id: '$assignee',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', TASK_STATUS.DONE] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$dueDate', null] },
                    { $lt: ['$dueDate', new Date()] },
                    { $not: [{ $in: ['$status', [TASK_STATUS.DONE, TASK_STATUS.CANCELLED]] }] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);
    return rows;
  },

  /** Status breakdown for a project, used for progress charts. */
  async statusCounts(projectId) {
    const rows = await Task.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(String(projectId)) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return rows.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});
  },
};

export { buildFilter };
export default taskRepository;
