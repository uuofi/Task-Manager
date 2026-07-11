import { logger } from '../config/logger.js';
import {
  ACTIVITY_ACTION,
  ENTITY_TYPE,
  NOTIFICATION_TYPE,
  RECURRENCE,
  ROLE_RANK,
  ROLES,
  SOCKET_EVENTS,
  TASK_STATUS,
} from '../constants/index.js';
import { projectRepository } from '../repositories/project.repository.js';
import { taskRepository } from '../repositories/task.repository.js';
import { realtime } from '../sockets/emitter.js';
import { ApiError } from '../utils/ApiError.js';

import { activityService } from './activity.service.js';
import { cacheService } from './cache.service.js';
import { sendTaskCreatedEmail } from './email.service.js';
import { notificationService } from './notification.service.js';

const LIST_CACHE_TTL_SECONDS = 30;

const taskLink = (taskId) => `/app/tasks/${taskId}`;

const assertMinRole = (role, minRole) => {
  if ((ROLE_RANK[role] ?? 0) < ROLE_RANK[minRole]) {
    throw ApiError.forbidden('You do not have permission to perform this action');
  }
};

/** Computes the next due date for a recurring task. */
const computeNextDue = (from, recurrence) => {
  if (!from) return null;
  const date = new Date(from);
  const n = recurrence.interval || 1;
  switch (recurrence.frequency) {
    case RECURRENCE.DAILY:
      date.setDate(date.getDate() + n);
      break;
    case RECURRENCE.WEEKLY:
      date.setDate(date.getDate() + 7 * n);
      break;
    case RECURRENCE.MONTHLY:
      date.setMonth(date.getMonth() + n);
      break;
    default:
      return null;
  }
  return date;
};

const create = async ({ workspace, project, user, data }) => {
  const counter = await projectRepository.nextTaskNumber(project.id);
  const number = counter.taskCounter;
  const key = `${counter.key}-${number}`;

  const task = await taskRepository.create({
    workspace: workspace.id,
    project: project.id,
    number,
    key,
    title: data.title,
    description: data.description ?? '',
    status: data.status ?? TASK_STATUS.BACKLOG,
    priority: data.priority,
    tags: data.tags ?? [],
    reporter: data.reporter ?? user.id,
    assignee: data.assignee ?? null,
    watchers: data.assignee ? [data.assignee] : [],
    estimatedHours: data.estimatedHours ?? 0,
    startDate: data.startDate ?? null,
    dueDate: data.dueDate ?? null,
    dependencies: data.dependencies ?? [],
    recurrence: data.recurrence ?? undefined,
    checklist: data.checklist ?? [],
    createdBy: user.id,
  });

  await activityService.log({
    workspace: workspace.id,
    project: project.id,
    task: task.id,
    actor: user.id,
    action: ACTIVITY_ACTION.CREATED,
    entityType: ENTITY_TYPE.TASK,
    entityId: task.id,
    message: `created ${key}`,
  });

  if (task.assignee) {
    await notificationService.notify({
      recipient: task.assignee,
      workspace: workspace.id,
      type: NOTIFICATION_TYPE.TASK_ASSIGNED,
      actor: user.id,
      title: 'New task assigned',
      body: `${user.name} assigned you ${key}: ${task.title}`,
      link: taskLink(task.id),
      entityType: ENTITY_TYPE.TASK,
      entityId: task.id,
      project: project.id,
      task: task.id,
    });
  }

  await cacheService.bumpTaskVersion(workspace.id);

  const populated = await taskRepository.findByIdPopulated(task.id);
  realtime.emitToProject(project.id, SOCKET_EVENTS.TASK_CREATED, populated.toJSON());

  // Fire-and-forget: email all project members (excluding the creator) about the new task.
  projectRepository
    .findByIdPopulated(project.id)
    .then((populatedProject) => {
      if (!populatedProject) return;
      const emails = new Set();
      for (const m of populatedProject.members) {
        if (m.user?.email && m.user.email !== user.email) emails.add(m.user.email);
      }
      if (populatedProject.lead?.email && populatedProject.lead.email !== user.email) {
        emails.add(populatedProject.lead.email);
      }
      if (!emails.size) return;
      return sendTaskCreatedEmail({
        recipients: [...emails],
        task: populated.toJSON ? populated.toJSON() : populated,
        projectName: populatedProject.name,
        createdByName: user.name,
      });
    })
    .catch((err) => logger.error('[email] task-created notification failed', { err }));

  return populated;
};

const getById = (taskId) => taskRepository.findByIdPopulated(taskId);

/** Cached, versioned by workspace — writes bump the version so stale lists never serve. */
const list = async ({ filters, pagination }) => {
  const version = await cacheService.taskVersion(filters.workspace);
  const key = `tasks:list:${filters.workspace}:${version}:${JSON.stringify({ filters, pagination })}`;
  return cacheService.getOrSet(key, LIST_CACHE_TTL_SECONDS, () =>
    taskRepository.paginate({ filters, ...pagination }),
  );
};

const board = (projectId) => taskRepository.board(projectId);

/**
 * Applies a partial update, records a field-level diff, and triggers
 * assignment / completion / recurrence side-effects.
 */
const update = async ({ task, project, workspace, user, data }) => {
  const changes = [];
  const track = (field, next) => {
    const prev = task[field];
    if (next !== undefined && String(prev ?? '') !== String(next ?? '')) {
      changes.push({ field, from: prev ?? null, to: next ?? null });
      task[field] = next;
    }
  };

  const previousStatus = task.status;
  const previousAssignee = task.assignee ? String(task.assignee) : null;

  ['title', 'description', 'priority', 'status', 'estimatedHours', 'startDate', 'dueDate'].forEach(
    (f) => track(f, data[f]),
  );
  if (data.tags !== undefined) {
    task.tags = data.tags;
    changes.push({ field: 'tags', from: null, to: data.tags });
  }
  if (data.assignee !== undefined) track('assignee', data.assignee);
  if (data.recurrence !== undefined) task.recurrence = data.recurrence;

  // Completion bookkeeping.
  if (data.status === TASK_STATUS.DONE && previousStatus !== TASK_STATUS.DONE) {
    task.completedAt = new Date();
  } else if (data.status && data.status !== TASK_STATUS.DONE) {
    task.completedAt = null;
  }

  await task.save();

  if (changes.length) {
    await activityService.log({
      workspace: workspace.id,
      project: project.id,
      task: task.id,
      actor: user.id,
      action:
        data.status && data.status !== previousStatus
          ? ACTIVITY_ACTION.STATUS_CHANGED
          : ACTIVITY_ACTION.UPDATED,
      entityType: ENTITY_TYPE.TASK,
      entityId: task.id,
      message:
        data.status && data.status !== previousStatus
          ? `changed status to ${data.status}`
          : `updated ${task.key}`,
      changes,
    });
  }

  // Notify newly-assigned user.
  const newAssignee = task.assignee ? String(task.assignee) : null;
  if (newAssignee && newAssignee !== previousAssignee) {
    if (!task.watchers.map(String).includes(newAssignee)) task.watchers.push(newAssignee);
    await task.save();
    await notificationService.notify({
      recipient: newAssignee,
      workspace: workspace.id,
      type: NOTIFICATION_TYPE.TASK_ASSIGNED,
      actor: user.id,
      title: 'Task assigned to you',
      body: `${user.name} assigned you ${task.key}: ${task.title}`,
      link: taskLink(task.id),
      entityType: ENTITY_TYPE.TASK,
      entityId: task.id,
      project: project.id,
      task: task.id,
    });
  }

  // Notify watchers/reporter on completion + spawn next recurrence.
  if (data.status === TASK_STATUS.DONE && previousStatus !== TASK_STATUS.DONE) {
    const recipients = [String(task.reporter), ...task.watchers.map(String)];
    await notificationService.notifyMany(recipients, {
      workspace: workspace.id,
      type: NOTIFICATION_TYPE.TASK_COMPLETED,
      actor: user.id,
      title: 'Task completed',
      body: `${user.name} completed ${task.key}: ${task.title}`,
      link: taskLink(task.id),
      entityType: ENTITY_TYPE.TASK,
      entityId: task.id,
      project: project.id,
      task: task.id,
    });
    await maybeSpawnRecurrence({ task, project, workspace, user });
  }

  await cacheService.bumpTaskVersion(workspace.id);

  const populated = await taskRepository.findByIdPopulated(task.id);
  realtime.emitToProject(project.id, SOCKET_EVENTS.TASK_UPDATED, populated.toJSON());
  return populated;
};

/** Creates the next occurrence of a recurring task when it is completed. */
const maybeSpawnRecurrence = async ({ task, project, workspace, user }) => {
  const rec = task.recurrence;
  if (!rec || rec.frequency === RECURRENCE.NONE) return;
  const nextDue = computeNextDue(task.dueDate || new Date(), rec);
  if (rec.until && nextDue && nextDue > rec.until) return;

  await create({
    workspace,
    project,
    user,
    data: {
      title: task.title,
      description: task.description,
      priority: task.priority,
      tags: task.tags,
      assignee: task.assignee,
      estimatedHours: task.estimatedHours,
      dueDate: nextDue,
      recurrence: rec,
      checklist: task.checklist.map((c) => ({ text: c.text, done: false })),
    },
  });
};

/** Board drag-and-drop: change column and/or position. */
const move = async ({ task, project, user, status, order }) => {
  const from = task.status;
  if (status !== undefined) task.status = status;
  if (order !== undefined) task.order = order;
  if (status === TASK_STATUS.DONE && from !== TASK_STATUS.DONE) task.completedAt = new Date();
  await task.save();

  if (status && status !== from) {
    await activityService.log({
      workspace: task.workspace,
      project: project.id,
      task: task.id,
      actor: user.id,
      action: ACTIVITY_ACTION.STATUS_CHANGED,
      entityType: ENTITY_TYPE.TASK,
      entityId: task.id,
      message: `moved ${task.key} to ${status}`,
      changes: [{ field: 'status', from, to: status }],
    });
  }

  await cacheService.bumpTaskVersion(task.workspace);

  const populated = await taskRepository.findByIdPopulated(task.id);
  realtime.emitToProject(project.id, SOCKET_EVENTS.TASK_UPDATED, populated.toJSON());
  return populated;
};

// --- Checklist -------------------------------------------------------------
const addChecklistItem = async ({ task, text }) => {
  task.checklist.push({ text });
  await task.save();
  return taskRepository.findByIdPopulated(task.id);
};

const toggleChecklistItem = async ({ task, user, itemId }) => {
  const item = task.checklist.id(itemId);
  if (!item) throw ApiError.notFound('Checklist item not found');
  item.done = !item.done;
  item.completedAt = item.done ? new Date() : null;
  item.completedBy = item.done ? user.id : null;
  await task.save();
  return taskRepository.findByIdPopulated(task.id);
};

const removeChecklistItem = async ({ task, itemId }) => {
  const item = task.checklist.id(itemId);
  if (!item) throw ApiError.notFound('Checklist item not found');
  item.deleteOne();
  await task.save();
  return taskRepository.findByIdPopulated(task.id);
};

// --- Dependencies ----------------------------------------------------------
const addDependency = async ({ task, dependsOnId }) => {
  if (String(dependsOnId) === String(task.id)) {
    throw ApiError.badRequest('A task cannot depend on itself');
  }
  const dep = await taskRepository.findById(dependsOnId);
  if (!dep || String(dep.workspace) !== String(task.workspace)) {
    throw ApiError.badRequest('Dependency must be a task in the same workspace');
  }
  if (!task.dependencies.map(String).includes(String(dependsOnId))) {
    task.dependencies.push(dependsOnId);
    await task.save();
  }
  return taskRepository.findByIdPopulated(task.id);
};

const removeDependency = async ({ task, dependsOnId }) => {
  task.dependencies = task.dependencies.filter((d) => String(d) !== String(dependsOnId));
  await task.save();
  return taskRepository.findByIdPopulated(task.id);
};

const remove = async ({ task, project, user, role }) => {
  const isReporter = String(task.reporter) === String(user.id);
  if (!isReporter) assertMinRole(role, ROLES.MANAGER);

  const { Comment } = await import('../models/Comment.js');
  const { TimeEntry } = await import('../models/TimeEntry.js');
  await Promise.all([
    Comment.deleteMany({ task: task.id }),
    TimeEntry.deleteMany({ task: task.id }),
  ]);
  await taskRepository.delete(task.id);
  await cacheService.bumpTaskVersion(task.workspace);

  await activityService.log({
    workspace: task.workspace,
    project: project?.id,
    actor: user.id,
    action: ACTIVITY_ACTION.DELETED,
    entityType: ENTITY_TYPE.TASK,
    entityId: task.id,
    message: `deleted ${task.key}`,
  });

  realtime.emitToProject(task.project, SOCKET_EVENTS.TASK_DELETED, { id: task.id });
  return { id: task.id };
};

export const taskService = {
  create,
  getById,
  list,
  board,
  update,
  move,
  addChecklistItem,
  toggleChecklistItem,
  removeChecklistItem,
  addDependency,
  removeDependency,
  remove,
};

export default taskService;
