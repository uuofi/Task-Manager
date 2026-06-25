import { ActivityLog } from '../models/ActivityLog.js';

export const activityRepository = {
  create(data) {
    return ActivityLog.create(data);
  },

  /** Paginated activity feed, optionally scoped to a project or task. */
  async paginate({ workspace, project, task, skip, limit, sort = '-createdAt' }) {
    const filter = { workspace };
    if (project) filter.project = project;
    if (task) filter.task = task;

    const [items, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('actor', 'name avatar')
        .lean({ virtuals: true }),
      ActivityLog.countDocuments(filter),
    ]);
    return { items, total };
  },
};

export default activityRepository;
