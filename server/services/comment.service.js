import {
  ACTIVITY_ACTION,
  ENTITY_TYPE,
  NOTIFICATION_TYPE,
  ROLE_RANK,
  ROLES,
  SOCKET_EVENTS,
} from '../constants/index.js';
import { commentRepository } from '../repositories/comment.repository.js';
import { taskRepository } from '../repositories/task.repository.js';
import { realtime } from '../sockets/emitter.js';
import { ApiError } from '../utils/ApiError.js';

import { activityService } from './activity.service.js';
import { notificationService } from './notification.service.js';

const taskLink = (taskId) => `/app/tasks/${taskId}`;

const create = async ({ task, workspace, project, user, data }) => {
  if (data.parentId) {
    const parent = await commentRepository.findById(data.parentId);
    if (!parent || String(parent.task) !== String(task.id)) {
      throw ApiError.badRequest('Parent comment not found for this task');
    }
  }

  const comment = await commentRepository.create({
    workspace: workspace.id,
    task: task.id,
    author: user.id,
    body: data.body,
    parent: data.parentId ?? null,
    mentions: data.mentions ?? [],
    attachments: data.attachments ?? [],
  });

  await taskRepository.incrementCommentCount(task.id, 1);

  await activityService.log({
    workspace: workspace.id,
    project: project?.id,
    task: task.id,
    actor: user.id,
    action: ACTIVITY_ACTION.COMMENTED,
    entityType: ENTITY_TYPE.COMMENT,
    entityId: comment.id,
    message: `commented on ${task.key}`,
  });

  // Notify mentioned users.
  if (data.mentions?.length) {
    await notificationService.notifyMany(data.mentions, {
      workspace: workspace.id,
      type: NOTIFICATION_TYPE.MENTION,
      actor: user.id,
      title: 'You were mentioned',
      body: `${user.name} mentioned you on ${task.key}`,
      link: taskLink(task.id),
      entityType: ENTITY_TYPE.TASK,
      entityId: task.id,
      project: project?.id,
      task: task.id,
    });
  }

  // Notify task participants (reporter, assignee, watchers) excluding mentions.
  const mentionSet = new Set((data.mentions ?? []).map(String));
  const participants = [
    String(task.reporter),
    task.assignee ? String(task.assignee) : null,
    ...task.watchers.map(String),
  ].filter((id) => id && !mentionSet.has(id));

  await notificationService.notifyMany(participants, {
    workspace: workspace.id,
    type: NOTIFICATION_TYPE.COMMENT_ADDED,
    actor: user.id,
    title: 'New comment',
    body: `${user.name} commented on ${task.key}`,
    link: taskLink(task.id),
    entityType: ENTITY_TYPE.TASK,
    entityId: task.id,
    project: project?.id,
    task: task.id,
  });

  const populated = await commentRepository.findByIdPopulated(comment.id);
  realtime.emitToProject(task.project, SOCKET_EVENTS.COMMENT_CREATED, populated.toJSON());
  return populated;
};

const list = (taskId) => commentRepository.listByTask(taskId);

const update = async ({ commentId, user, body }) => {
  const comment = await commentRepository.findById(commentId);
  if (!comment) throw ApiError.notFound('Comment not found');
  if (String(comment.author) !== String(user.id)) {
    throw ApiError.forbidden('You can only edit your own comments');
  }
  if (comment.isDeleted) throw ApiError.badRequest('Cannot edit a deleted comment');

  comment.body = body;
  comment.isEdited = true;
  comment.editedAt = new Date();
  await comment.save();

  const populated = await commentRepository.findByIdPopulated(comment.id);
  realtime.emitToProject(comment.task, SOCKET_EVENTS.COMMENT_UPDATED, populated.toJSON());
  return populated;
};

const remove = async ({ commentId, user, role }) => {
  const comment = await commentRepository.findById(commentId);
  if (!comment) throw ApiError.notFound('Comment not found');

  const isAuthor = String(comment.author) === String(user.id);
  if (!isAuthor && (ROLE_RANK[role] ?? 0) < ROLE_RANK[ROLES.MANAGER]) {
    throw ApiError.forbidden('You can only delete your own comments');
  }

  // Use a direct update so blanking `body` doesn't trip the required validator.
  await commentRepository.updateById(comment.id, {
    isDeleted: true,
    deletedAt: new Date(),
    body: '',
  });
  await taskRepository.incrementCommentCount(comment.task, -1);

  realtime.emitToProject(comment.task, SOCKET_EVENTS.COMMENT_DELETED, { id: comment.id });
  return { id: comment.id };
};

/** Toggles the current user's reaction with a given emoji. */
const react = async ({ commentId, user, emoji }) => {
  const comment = await commentRepository.findById(commentId);
  if (!comment) throw ApiError.notFound('Comment not found');

  let reaction = comment.reactions.find((r) => r.emoji === emoji);
  if (!reaction) {
    reaction = { emoji, users: [user.id] };
    comment.reactions.push(reaction);
  } else {
    const has = reaction.users.map(String).includes(String(user.id));
    reaction.users = has
      ? reaction.users.filter((u) => String(u) !== String(user.id))
      : [...reaction.users, user.id];
  }
  // Drop emojis with no reactors.
  comment.reactions = comment.reactions.filter((r) => r.users.length > 0);
  await comment.save();

  const populated = await commentRepository.findByIdPopulated(comment.id);
  realtime.emitToProject(comment.task, SOCKET_EVENTS.COMMENT_UPDATED, populated.toJSON());
  return populated;
};

export const commentService = { create, list, update, remove, react };

export default commentService;
