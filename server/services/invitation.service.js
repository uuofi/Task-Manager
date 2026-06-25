import {
  ENTITY_TYPE,
  INVITATION_STATUS,
  NOTIFICATION_TYPE,
  ROLE_RANK,
  ROLES,
  SOCKET_EVENTS,
} from '../constants/index.js';
import { invitationRepository } from '../repositories/invitation.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { realtime } from '../sockets/emitter.js';
import { ApiError } from '../utils/ApiError.js';
import { generateSecureToken } from '../utils/crypto.js';

import { notificationService } from './notification.service.js';

const INVITE_TTL_DAYS = 7;

const assertMinRole = (role, minRole) => {
  if ((ROLE_RANK[role] ?? 0) < ROLE_RANK[minRole]) {
    throw ApiError.forbidden('You do not have permission to perform this action');
  }
};

const invite = async ({ workspace, inviter, role, email, inviteRole }) => {
  assertMinRole(role, ROLES.MANAGER);
  const normalized = email.toLowerCase();

  // User must have a registered account
  const invitee = await userRepository.findByEmail(normalized);
  if (!invitee) {
    throw ApiError.notFound('No registered account found with this email address');
  }
  if (workspace.hasMember(invitee.id)) {
    throw ApiError.conflict('This user is already a workspace member');
  }
  if (await invitationRepository.findPendingByEmail(workspace.id, normalized)) {
    throw ApiError.conflict('An invitation is already pending for this user');
  }

  const { hash } = generateSecureToken();
  const finalRole = inviteRole || ROLES.MEMBER;
  const invitation = await invitationRepository.create({
    workspace: workspace.id,
    email: normalized,
    role: finalRole,
    invitedBy: inviter.id,
    tokenHash: hash,
    expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
  });

  // Send in-app notification only — no email
  await notificationService.notify({
    recipient: invitee._id,
    workspace: workspace.id,
    type: NOTIFICATION_TYPE.WORKSPACE_INVITATION,
    actor: inviter.id,
    title: 'Workspace invitation',
    body: `${inviter.name} invited you to join "${workspace.name}" as ${finalRole}`,
    link: '',
    entityType: ENTITY_TYPE.INVITATION,
    entityId: invitation._id,
  });

  return invitation;
};

const list = (workspace) => invitationRepository.listPending(workspace.id);

/** Registered user responds to a workspace invitation directly (no token needed). */
const respond = async ({ invitationId, user, action }) => {
  const invitation = await invitationRepository.findById(invitationId);
  if (!invitation || invitation.status !== INVITATION_STATUS.PENDING) {
    throw ApiError.notFound('Invitation not found or already used');
  }
  if (invitation.expiresAt.getTime() < Date.now()) {
    invitation.status = INVITATION_STATUS.EXPIRED;
    await invitation.save();
    throw ApiError.badRequest('This invitation has expired');
  }
  if (invitation.email !== user.email.toLowerCase()) {
    throw ApiError.forbidden('This invitation was issued to a different account');
  }

  const { Workspace } = await import('../models/Workspace.js');
  const workspace = await Workspace.findById(invitation.workspace);
  if (!workspace) throw ApiError.notFound('Workspace no longer exists');

  if (action === 'accept') {
    if (!workspace.hasMember(user.id)) {
      workspace.members.push({ user: user.id, role: invitation.role });
      await workspace.save();
    }

    // Also add to the target project if the invitation specifies one
    if (invitation.project) {
      const { Project } = await import('../models/Project.js');
      const project = await Project.findById(invitation.project);
      if (project && !project.getMemberRole(user.id)) {
        project.members.push({ user: user.id, role: invitation.role });
        await project.save();
      }
    }

    invitation.status = INVITATION_STATUS.ACCEPTED;
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = user.id;
    await invitation.save();

    // Notify the inviter
    await notificationService.notify({
      recipient: invitation.invitedBy,
      workspace: workspace.id,
      type: NOTIFICATION_TYPE.WORKSPACE_INVITATION,
      actor: user.id,
      title: 'Invitation accepted',
      body: `${user.name} accepted your invitation to join "${workspace.name}"`,
      link: '/app/team',
      entityType: ENTITY_TYPE.WORKSPACE,
      entityId: workspace._id,
    });

    const workspaceId = String(workspace._id);

    // Tell all existing workspace members to refresh their team list
    realtime.emitToWorkspace(workspaceId, SOCKET_EVENTS.WORKSPACE_MEMBER_JOINED, {
      userId: String(user.id || user._id),
    });

    // Tell the invitee's own socket to pick up the new workspace room
    realtime.emitToUser(String(user.id || user._id), SOCKET_EVENTS.WORKSPACE_JOINED, {
      workspaceId,
    });

    return { workspace: workspace.toJSON() };
  }

  // action === 'decline'
  invitation.status = INVITATION_STATUS.DECLINED;
  await invitation.save();
  return { declined: true };
};

/** Accepts an invitation via token (kept for backwards-compat / direct link flows). */
const accept = async ({ token, user }) => {
  const { hashToken } = await import('../utils/crypto.js');
  const invitation = await invitationRepository.findPendingByTokenHash(hashToken(token));
  if (!invitation) throw ApiError.badRequest('Invitation is invalid or has already been used');
  if (invitation.expiresAt.getTime() < Date.now()) {
    invitation.status = INVITATION_STATUS.EXPIRED;
    await invitation.save();
    throw ApiError.badRequest('This invitation has expired');
  }
  if (invitation.email !== user.email.toLowerCase()) {
    throw ApiError.forbidden('This invitation was issued to a different email address');
  }

  const { Workspace } = await import('../models/Workspace.js');
  const workspace = await Workspace.findById(invitation.workspace);
  if (!workspace) throw ApiError.notFound('Workspace no longer exists');

  if (!workspace.hasMember(user.id)) {
    workspace.members.push({ user: user.id, role: invitation.role });
    await workspace.save();
  }

  invitation.status = INVITATION_STATUS.ACCEPTED;
  invitation.acceptedAt = new Date();
  invitation.acceptedBy = user.id;
  await invitation.save();

  await notificationService.notify({
    recipient: invitation.invitedBy,
    workspace: workspace.id,
    type: NOTIFICATION_TYPE.WORKSPACE_INVITATION,
    actor: user.id,
    title: 'Invitation accepted',
    body: `${user.name} joined ${workspace.name}`,
    link: '/app/team',
    entityType: ENTITY_TYPE.WORKSPACE,
    entityId: workspace._id,
  });

  return { workspace: workspace.toJSON() };
};

const revoke = async ({ workspace, role, invitationId }) => {
  assertMinRole(role, ROLES.MANAGER);
  const invitation = await invitationRepository.findById(invitationId);
  if (!invitation || String(invitation.workspace) !== String(workspace.id)) {
    throw ApiError.notFound('Invitation not found');
  }
  await invitationRepository.deleteById(invitationId);
  return { id: invitationId };
};

export const invitationService = { invite, list, respond, accept, revoke };

export default invitationService;
