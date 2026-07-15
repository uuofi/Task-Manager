import { invitationService } from '../services/invitation.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createInvitation = asyncHandler(async (req, res) => {
  const invitation = await invitationService.invite({
    workspace: req.workspace,
    inviter: req.user,
    role: req.membershipRole,
    email: req.body.email,
    inviteRole: req.body.role,
    projectId: req.body.projectId,
    permissions: req.body.permissions,
  });
  return ApiResponse.created(res, invitation, 'Invitation sent');
});

export const listInvitations = asyncHandler(async (req, res) => {
  const invitations = await invitationService.list(req.workspace);
  return ApiResponse.ok(res, invitations, 'Invitations loaded');
});

export const revokeInvitation = asyncHandler(async (req, res) => {
  const result = await invitationService.revoke({
    workspace: req.workspace,
    role: req.membershipRole,
    invitationId: req.params.id,
  });
  return ApiResponse.ok(res, result, 'Invitation revoked');
});

export const respondToInvitation = asyncHandler(async (req, res) => {
  const result = await invitationService.respond({
    invitationId: req.params.id,
    user: req.user,
    action: req.body.action,
  });
  return ApiResponse.ok(res, result, 'Response recorded');
});
