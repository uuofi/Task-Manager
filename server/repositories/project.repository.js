import { Project } from '../models/Project.js';

export const projectRepository = {
  create(data) {
    return Project.create(data);
  },

  findById(id) {
    return Project.findById(id);
  },

  findByIdPopulated(id) {
    return Project.findById(id)
      .populate('lead', 'name avatar email')
      .populate('members.user', 'name avatar email')
      .populate('createdBy', 'name avatar');
  },

  existsByKey(workspace, key) {
    return Project.exists({ workspace, key: key.toUpperCase() });
  },

  /** Paginated, filterable list of projects within a workspace. */
  async paginate({ workspace, status, search, memberId, skip, limit, sort }) {
    const filter = { workspace };
    if (status) filter.status = status;
    if (memberId) filter['members.user'] = memberId;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const [items, total] = await Promise.all([
      Project.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('lead', 'name avatar')
        .populate('members.user', 'name avatar')
        .lean({ virtuals: true }),
      Project.countDocuments(filter),
    ]);
    return { items, total };
  },

  /** Atomically increments and returns the next task number for a project. */
  nextTaskNumber(projectId) {
    return Project.findByIdAndUpdate(
      projectId,
      { $inc: { taskCounter: 1 } },
      { new: true },
    ).select('taskCounter key');
  },

  delete(id) {
    return Project.findByIdAndDelete(id);
  },
};

export default projectRepository;
