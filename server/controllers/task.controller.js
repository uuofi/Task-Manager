import { taskService } from '../services/task.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePagination } from '../utils/pagination.js';

const toArray = (value) =>
  value === undefined ? undefined : Array.isArray(value) ? value : String(value).split(',');

export const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.create({
    workspace: req.workspace,
    project: req.project,
    user: req.user,
    data: req.body,
  });
  return ApiResponse.created(res, task, 'Task created');
});

export const listTasks = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { defaultSort: '-createdAt', maxLimit: 200 });
  const filters = {
    workspace: req.workspace.id,
    project: req.query.projectId,
    status: toArray(req.query.status),
    priority: toArray(req.query.priority),
    assignee: req.query.assignee,
    reporter: req.query.reporter,
    tags: toArray(req.query.tags),
    search: req.query.search,
    overdue: req.query.overdue === 'true',
    dueBefore: req.query.dueBefore ? new Date(req.query.dueBefore) : undefined,
    dueAfter: req.query.dueAfter ? new Date(req.query.dueAfter) : undefined,
    createdAfter: req.query.createdAfter,
    createdBefore: req.query.createdBefore,
  };
  const { items, total } = await taskService.list({ filters, pagination });
  return ApiResponse.ok(res, items, 'Tasks loaded', ApiResponse.paginate({ ...pagination, total }));
});

export const getBoard = asyncHandler(async (req, res) => {
  const tasks = await taskService.board(req.project.id);
  return ApiResponse.ok(res, tasks, 'Board loaded');
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getById(req.task.id);
  return ApiResponse.ok(res, task, 'Task loaded');
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.update({
    task: req.task,
    project: req.project,
    workspace: req.workspace,
    user: req.user,
    data: req.body,
  });
  return ApiResponse.ok(res, task, 'Task updated');
});

export const moveTask = asyncHandler(async (req, res) => {
  const task = await taskService.move({
    task: req.task,
    project: req.project,
    user: req.user,
    status: req.body.status,
    order: req.body.order,
  });
  return ApiResponse.ok(res, task, 'Task moved');
});

export const deleteTask = asyncHandler(async (req, res) => {
  const result = await taskService.remove({
    task: req.task,
    project: req.project,
    user: req.user,
    role: req.membershipRole,
  });
  return ApiResponse.ok(res, result, 'Task deleted');
});

export const addChecklistItem = asyncHandler(async (req, res) => {
  const task = await taskService.addChecklistItem({ task: req.task, text: req.body.text });
  return ApiResponse.ok(res, task, 'Checklist item added');
});

export const toggleChecklistItem = asyncHandler(async (req, res) => {
  const task = await taskService.toggleChecklistItem({
    task: req.task,
    user: req.user,
    itemId: req.params.itemId,
  });
  return ApiResponse.ok(res, task, 'Checklist item updated');
});

export const removeChecklistItem = asyncHandler(async (req, res) => {
  const task = await taskService.removeChecklistItem({
    task: req.task,
    itemId: req.params.itemId,
  });
  return ApiResponse.ok(res, task, 'Checklist item removed');
});

export const addDependency = asyncHandler(async (req, res) => {
  const task = await taskService.addDependency({
    task: req.task,
    dependsOnId: req.body.dependsOnId,
  });
  return ApiResponse.ok(res, task, 'Dependency added');
});

export const removeDependency = asyncHandler(async (req, res) => {
  const task = await taskService.removeDependency({
    task: req.task,
    dependsOnId: req.params.dependsOnId,
  });
  return ApiResponse.ok(res, task, 'Dependency removed');
});
