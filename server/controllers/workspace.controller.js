import { workspaceService } from '../services/workspace.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCurrentWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.getCurrent(req.workspace.id);
  return ApiResponse.ok(res, workspace, 'Workspace loaded');
});

export const listMyWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await workspaceService.listForUser(req.user.id);
  return ApiResponse.ok(res, workspaces, 'Workspaces loaded');
});

export const updateWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.update({
    workspace: req.workspace,
    role: req.membershipRole,
    data: req.body,
  });
  return ApiResponse.ok(res, workspace, 'Workspace updated');
});

export const listMembers = asyncHandler(async (req, res) => {
  const members = await workspaceService.listMembers(req.workspace);
  return ApiResponse.ok(res, members, 'Members loaded');
});

export const updateMemberRole = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.updateMemberRole({
    workspace: req.workspace,
    actorRole: req.membershipRole,
    targetUserId: req.params.userId,
    newRole: req.body.role,
  });
  return ApiResponse.ok(res, workspace, 'Member role updated');
});

export const updateMemberPermissions = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.updateMemberPermissions({
    workspace: req.workspace,
    actorRole: req.membershipRole,
    targetUserId: req.params.userId,
    permissions: req.body,
  });
  return ApiResponse.ok(res, workspace, 'Member permissions updated');
});

export const removeMember = asyncHandler(async (req, res) => {
  const result = await workspaceService.removeMember({
    workspace: req.workspace,
    actorRole: req.membershipRole,
    targetUserId: req.params.userId,
  });
  return ApiResponse.ok(res, result, 'Member removed');
});

export const leaveWorkspace = asyncHandler(async (req, res) => {
  const result = await workspaceService.leave({ workspace: req.workspace, user: req.user });
  return ApiResponse.ok(res, result, 'You left the workspace');
});
