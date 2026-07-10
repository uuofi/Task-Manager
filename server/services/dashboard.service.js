import { PROJECT_STATUS, TASK_STATUS } from '../constants/index.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { Workspace } from '../models/Workspace.js';
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

/**
 * Workspace-wide team analytics: per-member workload, aggregate totals,
 * status/priority breakdowns and recent activity. Powers the Team Insights page
 * so managers can see how work is distributed and where the team is overloaded.
 */
const getTeamAnalytics = async ({ workspace }) => {
  const workspaceId = workspace._id;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [populated, assigneeStats, statusAgg, priorityAgg, totalTasks, completedTotal, completedThisWeek, unassignedOpen] =
    await Promise.all([
      Workspace.findById(workspace.id).populate('members.user', 'name avatar email isOnline lastSeenAt'),
      taskRepository.assigneeStats(workspace.id),
      Task.aggregate([
        { $match: { workspace: workspaceId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { workspace: workspaceId } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Task.countDocuments({ workspace: workspace.id }),
      Task.countDocuments({ workspace: workspace.id, status: TASK_STATUS.DONE }),
      Task.countDocuments({ workspace: workspace.id, status: TASK_STATUS.DONE, completedAt: { $gte: weekAgo } }),
      Task.countDocuments({ workspace: workspace.id, assignee: null, status: OPEN_STATES }),
    ]);

  // Per-assignee "in progress" counts (not covered by assigneeStats).
  const inProgressAgg = await Task.aggregate([
    { $match: { workspace: workspaceId, status: TASK_STATUS.IN_PROGRESS, assignee: { $ne: null } } },
    { $group: { _id: '$assignee', count: { $sum: 1 } } },
  ]);
  const inProgressById = inProgressAgg.reduce((acc, r) => ({ ...acc, [String(r._id)]: r.count }), {});
  const statsById = assigneeStats.reduce((acc, s) => ({ ...acc, [String(s._id)]: s }), {});

  const members = populated.members
    .map((m) => {
      const u = m.user;
      const stat = statsById[String(u.id)] || { total: 0, completed: 0, overdue: 0 };
      return {
        user: u,
        role: m.role,
        total: stat.total,
        completed: stat.completed,
        overdue: stat.overdue,
        inProgress: inProgressById[String(u.id)] || 0,
        open: stat.total - stat.completed,
        completionRate: stat.total ? Math.round((stat.completed / stat.total) * 100) : 0,
      };
    })
    // Heaviest workload first so overloaded members surface at the top.
    .sort((a, b) => b.open - a.open || b.total - a.total);

  const toMap = (rows) => rows.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});
  const overdueTotal = members.reduce((sum, m) => sum + m.overdue, 0);

  return {
    totals: {
      totalTasks,
      completed: completedTotal,
      completedThisWeek,
      overdue: overdueTotal,
      unassigned: unassignedOpen,
      memberCount: members.length,
      completionRate: totalTasks ? Math.round((completedTotal / totalTasks) * 100) : 0,
    },
    members,
    statusBreakdown: toMap(statusAgg),
    priorityBreakdown: toMap(priorityAgg),
    generatedAt: new Date(),
  };
};

export const dashboardService = { getDashboard, getTeamAnalytics };

export default dashboardService;
