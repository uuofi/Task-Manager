import { Comment } from '../models/Comment.js';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { Workspace } from '../models/Workspace.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Loads a Project from a route param, derives its Workspace, verifies the
 * caller is a workspace member, and attaches request context:
 *   req.project, req.workspace, req.membershipRole, req.projectRole
 *
 * Removes the need to pass a workspace id explicitly on project routes.
 */
export const loadProject = (param = 'projectId') =>
  asyncHandler(async (req, _res, next) => {
    const projectId = req.params[param] || req.body?.projectId;
    const project = await Project.findById(projectId);
    if (!project) throw ApiError.notFound('Project not found');

    const workspace = await Workspace.findById(project.workspace);
    if (!workspace) throw ApiError.notFound('Workspace not found');

    const role = workspace.getMemberRole(req.user.id);
    if (!role) throw ApiError.forbidden('You are not a member of this workspace');

    req.project = project;
    req.workspace = workspace;
    req.membershipRole = role;
    req.projectRole = project.getMemberRole(req.user.id);
    next();
  });

/**
 * Loads a Task from a route param, plus its Project + Workspace, verifies
 * workspace membership, and attaches the same context as loadProject (with
 * req.task added).
 */
export const loadTask = (param = 'taskId') =>
  asyncHandler(async (req, _res, next) => {
    const task = await Task.findById(req.params[param]);
    if (!task) throw ApiError.notFound('Task not found');

    const [project, workspace] = await Promise.all([
      Project.findById(task.project),
      Workspace.findById(task.workspace),
    ]);
    if (!workspace) throw ApiError.notFound('Workspace not found');

    const role = workspace.getMemberRole(req.user.id);
    if (!role) throw ApiError.forbidden('You are not a member of this workspace');

    req.task = task;
    req.project = project;
    req.workspace = workspace;
    req.membershipRole = role;
    req.projectRole = project?.getMemberRole(req.user.id) ?? null;
    next();
  });

/**
 * Loads a Comment from a route param, derives its Workspace, verifies the
 * caller is a workspace member, and attaches req.comment + req.membershipRole.
 */
export const loadComment = (param = 'commentId') =>
  asyncHandler(async (req, _res, next) => {
    const comment = await Comment.findById(req.params[param]);
    if (!comment) throw ApiError.notFound('Comment not found');

    const workspace = await Workspace.findById(comment.workspace);
    if (!workspace) throw ApiError.notFound('Workspace not found');

    const role = workspace.getMemberRole(req.user.id);
    if (!role) throw ApiError.forbidden('You are not a member of this workspace');

    req.comment = comment;
    req.workspace = workspace;
    req.membershipRole = role;
    next();
  });

export default { loadProject, loadTask, loadComment };
