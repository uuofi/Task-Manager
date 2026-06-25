import {
  ENTITY_TYPE,
  NOTIFICATION_TYPE,
  SUGGESTION_STATUS,
} from '../constants/index.js';
import { Project } from '../models/Project.js';
import { suggestionRepository } from '../repositories/suggestion.repository.js';
import { ApiError } from '../utils/ApiError.js';

import { notificationService } from './notification.service.js';
import { taskService } from './task.service.js';

const create = async ({ workspace, user, data }) => {
  if (!workspace.hasMember(data.suggestedTo)) {
    throw ApiError.badRequest('You can only suggest tasks to workspace members');
  }

  const suggestion = await suggestionRepository.create({
    workspace: workspace.id,
    project: data.projectId ?? null,
    title: data.title,
    description: data.description ?? '',
    priority: data.priority,
    dueDate: data.dueDate ?? null,
    suggestedBy: user.id,
    suggestedTo: data.suggestedTo,
  });

  await notificationService.notify({
    recipient: data.suggestedTo,
    workspace: workspace.id,
    type: NOTIFICATION_TYPE.TASK_SUGGESTION,
    actor: user.id,
    title: 'New task suggestion',
    body: `${user.name} suggested a task: ${suggestion.title}`,
    link: '/app/suggestions',
    entityType: ENTITY_TYPE.TASK,
    entityId: suggestion.id,
  });

  return suggestionRepository.findByIdPopulated(suggestion.id);
};

const listReceived = ({ workspace, user, status, pagination }) =>
  suggestionRepository.paginate({ workspace: workspace.id, suggestedTo: user.id, status, ...pagination });

const listSent = ({ workspace, user, status, pagination }) =>
  suggestionRepository.paginate({ workspace: workspace.id, suggestedBy: user.id, status, ...pagination });

const ensureRecipient = (suggestion, user) => {
  if (String(suggestion.suggestedTo) !== String(user.id)) {
    throw ApiError.forbidden('Only the recipient can respond to this suggestion');
  }
  if (suggestion.status !== SUGGESTION_STATUS.PENDING) {
    throw ApiError.badRequest('This suggestion has already been answered');
  }
};

/** Accepts a suggestion and converts it into a real task in the chosen project. */
const accept = async ({ suggestionId, workspace, user, projectId }) => {
  const suggestion = await suggestionRepository.findById(suggestionId);
  if (!suggestion) throw ApiError.notFound('Suggestion not found');
  ensureRecipient(suggestion, user);

  const targetProjectId = projectId || suggestion.project;
  if (!targetProjectId) throw ApiError.badRequest('A target project is required');

  const project = await Project.findById(targetProjectId);
  if (!project || String(project.workspace) !== String(workspace.id)) {
    throw ApiError.badRequest('Project not found in this workspace');
  }

  const task = await taskService.create({
    workspace,
    project,
    user,
    data: {
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority,
      dueDate: suggestion.dueDate,
      assignee: user.id, // recipient takes ownership
    },
  });

  suggestion.status = SUGGESTION_STATUS.ACCEPTED;
  suggestion.respondedAt = new Date();
  suggestion.resultingTask = task.id;
  await suggestion.save();

  await notificationService.notify({
    recipient: suggestion.suggestedBy,
    workspace: workspace.id,
    type: NOTIFICATION_TYPE.TASK_SUGGESTION,
    actor: user.id,
    title: 'Suggestion accepted',
    body: `${user.name} accepted your suggestion "${suggestion.title}"`,
    link: `/app/tasks/${task.id}`,
    entityType: ENTITY_TYPE.TASK,
    entityId: task.id,
  });

  return suggestionRepository.findByIdPopulated(suggestion.id);
};

const reject = async ({ suggestionId, workspace, user, note }) => {
  const suggestion = await suggestionRepository.findById(suggestionId);
  if (!suggestion) throw ApiError.notFound('Suggestion not found');
  ensureRecipient(suggestion, user);

  suggestion.status = SUGGESTION_STATUS.REJECTED;
  suggestion.responseNote = note ?? '';
  suggestion.respondedAt = new Date();
  await suggestion.save();

  await notificationService.notify({
    recipient: suggestion.suggestedBy,
    workspace: workspace.id,
    type: NOTIFICATION_TYPE.TASK_SUGGESTION,
    actor: user.id,
    title: 'Suggestion declined',
    body: `${user.name} declined your suggestion "${suggestion.title}"`,
    link: '/app/suggestions',
    entityType: ENTITY_TYPE.USER,
    entityId: user.id,
  });

  return suggestionRepository.findByIdPopulated(suggestion.id);
};

export const suggestionService = { create, listReceived, listSent, accept, reject };

export default suggestionService;
