import { PROJECT_STATUS, TASK_STATUS } from '../constants/index.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { taskRepository } from '../repositories/task.repository.js';

import { activityService } from './activity.service.js';

const OPEN_STATES = { $nin: [TASK_STATUS.DONE, TASK_STATUS.CANCELLED] };

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

const TASK_SELECT = 'title key status priority dueDate project';
const populateProject = (q) => q.populate('project', 'name key color');

/**
 * Builds the personalized dashboard payload for a user within a workspace:
 * today's work, overdue items, counts, status/priority breakdowns, project
 * progress and recent activity.
 */
const getDashboard = async ({ workspace, user }) => {
  const assigned = { workspace: workspace.id, assignee: user.id };
  const now = new Date();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [todayTasks, overdueTasks, upcomingTasks] = await Promise.all([
    populateProject(
      Task.find({ ...assigned, status: OPEN_STATES, dueDate: { $gte: startOfToday(), $lte: endOfToday() } })
        .select(TASK_SELECT)
        .sort('priority')
        .limit(20),
    ).lean({ virtuals: true }),
    populateProject(
      Task.find({ ...assigned, status: OPEN_STATES, dueDate: { $lt: startOfToday() } })
        .select(TASK_SELECT)
        .sort('dueDate')
        .limit(20),
    ).lean({ virtuals: true }),
    populateProject(
      Task.find({
        ...assigned,
        status: OPEN_STATES,
        dueDate: { $gt: endOfToday(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      })
        .select(TASK_SELECT)
        .sort('dueDate')
        .limit(20),
    ).lean({ virtuals: true }),
  ]);

  const [assignedTotal, completedTotal, completedThisWeek, statusAgg, priorityAgg] =
    await Promise.all([
      Task.countDocuments(assigned),
      Task.countDocuments({ ...assigned, status: TASK_STATUS.DONE }),
      Task.countDocuments({ ...assigned, status: TASK_STATUS.DONE, completedAt: { $gte: weekAgo } }),
      Task.aggregate([
        { $match: { workspace: workspace._id, assignee: user._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { workspace: workspace._id, assignee: user._id } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
    ]);

  const toMap = (rows) => rows.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});

  // Active projects with completion %.
  const projects = await Project.find({ workspace: workspace.id, status: PROJECT_STATUS.ACTIVE })
    .select('name key color')
    .limit(8)
    .lean({ virtuals: true });

  const projectProgress = await Promise.all(
    projects.map(async (p) => {
      const counts = await taskRepository.statusCounts(p._id);
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const done = counts[TASK_STATUS.DONE] || 0;
      return {
        project: p,
        total,
        done,
        progress: total ? Math.round((done / total) * 100) : 0,
      };
    }),
  );

  const { items: recentActivity } = await activityService.list({
    workspace: workspace.id,
    pagination: { skip: 0, limit: 8 },
  });

  return {
    stats: {
      assigned: assignedTotal,
      completed: completedTotal,
      completedThisWeek,
      overdue: overdueTasks.length,
      dueToday: todayTasks.length,
    },
    todayTasks,
    overdueTasks,
    upcomingTasks,
    statusBreakdown: toMap(statusAgg),
    priorityBreakdown: toMap(priorityAgg),
    projectProgress,
    recentActivity,
    generatedAt: now,
  };
};

export const dashboardService = { getDashboard };

export default dashboardService;
