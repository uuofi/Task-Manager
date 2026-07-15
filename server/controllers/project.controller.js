import { projectService } from '../services/project.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePagination } from '../utils/pagination.js';

export const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.create({
    workspace: req.workspace,
    user: req.user,
    role: req.membershipRole,
    data: req.body,
  });
  return ApiResponse.created(res, project, 'Project created');
});

export const listProjects = asyncHandler(async (req, res) => {
  const pagination = parsePagination(req.query, { defaultSort: '-createdAt' });
  const { items, total } = await projectService.list({
    workspace: req.workspace,
    filters: {
      status: req.query.status,
      search: req.query.search,
      memberId: req.query.memberId,
    },
    pagination,
  });
  return ApiResponse.ok(res, items, 'Projects loaded', ApiResponse.paginate({ ...pagination, total }));
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getById(req.project.id);
  return ApiResponse.ok(res, project, 'Project loaded');
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.update({
    project: req.project,
    user: req.user,
    role: req.membershipRole,
    data: req.body,
  });
  return ApiResponse.ok(res, project, 'Project updated');
});

export const archiveProject = asyncHandler(async (req, res) => {
  const project = await projectService.setArchived({
    project: req.project,
    user: req.user,
    role: req.membershipRole,
    archived: true,
  });
  return ApiResponse.ok(res, project, 'Project archived');
});

export const restoreProject = asyncHandler(async (req, res) => {
  const project = await projectService.setArchived({
    project: req.project,
    user: req.user,
    role: req.membershipRole,
    archived: false,
  });
  return ApiResponse.ok(res, project, 'Project restored');
});

export const deleteProject = asyncHandler(async (req, res) => {
  const result = await projectService.remove({ project: req.project, role: req.membershipRole });
  return ApiResponse.ok(res, result, 'Project deleted');
});

export const addProjectMember = asyncHandler(async (req, res) => {
  const project = await projectService.addMember({
    project: req.project,
    workspace: req.workspace,
    user: req.user,
    targetUserId: req.body.userId,
    memberRole: req.body.role,
  });
  return ApiResponse.created(res, project, 'Member added');
});

export const acceptProjectInvitation = asyncHandler(async (req, res) => {
  const project = await projectService.acceptProjectInvitation({
    token: req.body.token,
    user: req.user,
  });
  return ApiResponse.ok(res, project, 'You have joined the project');
});

export const removeProjectMember = asyncHandler(async (req, res) => {
  const project = await projectService.removeMember({
    project: req.project,
    workspace: req.workspace,
    user: req.user,
    targetUserId: req.params.userId,
  });
  return ApiResponse.ok(res, project, 'Member removed');
});

export const leaveProject = asyncHandler(async (req, res) => {
  const result = await projectService.leaveProject({ project: req.project, user: req.user });
  return ApiResponse.ok(res, result, 'You left the project');
});
