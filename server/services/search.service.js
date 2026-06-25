import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Global search across projects, tasks, users (workspace members) and tags
 * within a single workspace. Each section is capped for snappy results.
 */
const search = async ({ workspace, query, types }) => {
  const q = escapeRegex(query.trim());
  const rx = new RegExp(q, 'i');
  const want = (t) => !types || types.includes(t);

  const result = {};

  if (want('projects')) {
    result.projects = await Project.find({ workspace: workspace.id, name: rx })
      .select('name key color status')
      .limit(8)
      .lean({ virtuals: true });
  }

  if (want('tasks')) {
    result.tasks = await Task.find({
      workspace: workspace.id,
      $or: [{ title: rx }, { key: rx }, { tags: rx }],
    })
      .select('title key status priority project')
      .populate('project', 'name key color')
      .limit(12)
      .lean({ virtuals: true });
  }

  if (want('users')) {
    const memberIds = workspace.members.map((m) => m.user);
    result.users = await User.find({
      _id: { $in: memberIds },
      $or: [{ name: rx }, { email: rx }],
    })
      .select('name email avatar')
      .limit(8)
      .lean({ virtuals: true });
  }

  if (want('tags')) {
    const tags = await Task.distinct('tags', { workspace: workspace.id, tags: rx });
    result.tags = tags.slice(0, 12);
  }

  return result;
};

export const searchService = { search };

export default searchService;
