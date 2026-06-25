import {
  ACTIVITY_ACTION,
  ENTITY_TYPE,
  INVITATION_STATUS,
  PROJECT_STATUS,
  ROLE_RANK,
  ROLES,
} from '../constants/index.js';
import { env } from '../config/env.js';
import { projectInvitationRepository } from '../repositories/projectInvitation.repository.js';
import { projectRepository } from '../repositories/project.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { generateSecureToken, hashToken } from '../utils/crypto.js';
import { slugify } from '../utils/slug.js';

import { logger } from '../config/logger.js';
import { activityService } from './activity.service.js';
import { sendProjectInvitationEmail } from './email.service.js';

/** Throws 403 unless `role` is at least as privileged as `minRole`. */
const assertMinRole = (role, minRole) => {
  if ((ROLE_RANK[role] ?? 0) < ROLE_RANK[minRole]) {
    throw ApiError.forbidden('You do not have permission to perform this action');
  }
};

/** Derives a 2–6 char uppercase project key from an explicit key or the name. */
const buildKey = async (workspaceId, name, explicitKey) => {
  const base = (explicitKey || slugify(name).replace(/-/g, ''))
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
  let key = base.length >= 2 ? base : `${base}PR`.slice(0, 6);

  let suffix = 1;
  const root = key.slice(0, 4);
   
  while (await projectRepository.existsByKey(workspaceId, key)) {
    key = `${root}${suffix}`;
    suffix += 1;
  }
  return key;
};

const create = async ({ workspace, user, role, data }) => {
  assertMinRole(role, ROLES.MANAGER);

  const key = await buildKey(workspace.id, data.name, data.key);

  // Add every workspace member to the project so the whole team can access it.
  // The creator is the lead/manager; everyone else keeps their workspace role.
  const members = workspace.members.map((m) => ({
    user: m.user,
    role: String(m.user) === String(user.id) ? ROLES.MANAGER : m.role,
  }));
  if (!members.some((m) => String(m.user) === String(user.id))) {
    members.push({ user: user.id, role: ROLES.MANAGER });
  }

  const project = await projectRepository.create({
    workspace: workspace.id,
    name: data.name,
    key,
    description: data.description ?? '',
    color: data.color,
    icon: data.icon,
    startDate: data.startDate ?? null,
    dueDate: data.dueDate ?? null,
    lead: user.id,
    members,
    createdBy: user.id,
  });

  await activityService.log({
    workspace: workspace.id,
    project: project.id,
    actor: user.id,
    action: ACTIVITY_ACTION.CREATED,
    entityType: ENTITY_TYPE.PROJECT,
    entityId: project.id,
    message: `created project "${project.name}"`,
  });

  return projectRepository.findByIdPopulated(project.id);
};

const list = ({ workspace, filters, pagination }) =>
  projectRepository.paginate({
    workspace: workspace.id,
    status: filters.status,
    search: filters.search,
    memberId: filters.memberId,
    ...pagination,
  });

const getById = (projectId) => projectRepository.findByIdPopulated(projectId);

const update = async ({ project, user, role, data }) => {
  const isLead = String(project.lead) === String(user.id);
  if (!isLead) assertMinRole(role, ROLES.MANAGER);

  const fields = ['name', 'description', 'color', 'icon', 'startDate', 'dueDate'];
  fields.forEach((f) => {
    if (data[f] !== undefined) project[f] = data[f];
  });
  await project.save();

  await activityService.log({
    workspace: project.workspace,
    project: project.id,
    actor: user.id,
    action: ACTIVITY_ACTION.UPDATED,
    entityType: ENTITY_TYPE.PROJECT,
    entityId: project.id,
    message: `updated project "${project.name}"`,
  });

  return projectRepository.findByIdPopulated(project.id);
};

const setArchived = async ({ project, user, role, archived }) => {
  assertMinRole(role, ROLES.MANAGER);
  project.status = archived ? PROJECT_STATUS.ARCHIVED : PROJECT_STATUS.ACTIVE;
  project.archivedAt = archived ? new Date() : null;
  await project.save();

  await activityService.log({
    workspace: project.workspace,
    project: project.id,
    actor: user.id,
    action: archived ? ACTIVITY_ACTION.ARCHIVED : ACTIVITY_ACTION.RESTORED,
    entityType: ENTITY_TYPE.PROJECT,
    entityId: project.id,
    message: `${archived ? 'archived' : 'restored'} project "${project.name}"`,
  });

  return projectRepository.findByIdPopulated(project.id);
};

const remove = async ({ project, role }) => {
  assertMinRole(role, ROLES.ADMIN);
  // Cascade deletes are handled by the task service in a transaction-free sweep
  // (acceptable for this scale); related tasks/comments are removed there.
  const { Task } = await import('../models/Task.js');
  const { Comment } = await import('../models/Comment.js');
  const { TimeEntry } = await import('../models/TimeEntry.js');
  const taskIds = await Task.find({ project: project.id }).distinct('_id');
  await Promise.all([
    Comment.deleteMany({ task: { $in: taskIds } }),
    TimeEntry.deleteMany({ project: project.id }),
    Task.deleteMany({ project: project.id }),
  ]);
  await projectRepository.delete(project.id);
  return { id: project.id };
};

const INVITE_TTL_DAYS = 7;

/** Directly adds an existing workspace member to the project — no email or token needed. */
const addMember = async ({ project, workspace, user, role, targetUserId, memberRole }) => {
  assertMinRole(role, ROLES.MANAGER);

  if (!workspace.hasMember(targetUserId)) {
    throw ApiError.badRequest('User must be a workspace member first');
  }
  if (project.getMemberRole(targetUserId)) {
    throw ApiError.conflict('User is already a project member');
  }

  project.members.push({ user: targetUserId, role: memberRole || ROLES.MEMBER });
  await project.save();

  await activityService.log({
    workspace: workspace.id,
    project: project.id,
    actor: user.id,
    action: ACTIVITY_ACTION.INVITED,
    entityType: ENTITY_TYPE.PROJECT,
    entityId: project.id,
    message: `added a member to project "${project.name}"`,
  });

  return projectRepository.findByIdPopulated(project.id);
};

/**
 * Sends a project invitation email to an existing workspace member.
 * The member is NOT added immediately — they must accept via the link in the email.
 */
const inviteMember = async ({ project, workspace, user, role, targetUserId, memberRole }) => {
  logger.info(`[invite] start — inviter=${user.id} target=${targetUserId} project=${project.id}`);

  assertMinRole(role, ROLES.MANAGER);

  if (!workspace.hasMember(targetUserId)) {
    logger.warn(`[invite] target ${targetUserId} is not a workspace member`);
    throw ApiError.badRequest('User must be a workspace member first');
  }
  if (project.getMemberRole(targetUserId)) {
    logger.warn(`[invite] target ${targetUserId} is already a project member`);
    throw ApiError.conflict('User is already a project member');
  }
  if (await projectInvitationRepository.findPendingByUserAndProject(targetUserId, project.id)) {
    logger.warn(`[invite] pending invitation already exists for ${targetUserId}`);
    throw ApiError.conflict('An invitation is already pending for this user');
  }

  const targetUser = await userRepository.findById(targetUserId);
  if (!targetUser) throw ApiError.notFound('User not found');

  logger.info(`[invite] sending to ${targetUser.email}`);

  const { token, hash } = generateSecureToken();
  await projectInvitationRepository.create({
    workspace: workspace.id,
    project: project.id,
    user: targetUserId,
    role: memberRole || ROLES.MEMBER,
    invitedBy: user.id,
    tokenHash: hash,
    expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
  });

  const acceptUrl = `${env.clientUrl}/accept-project-invite?token=${token}`;

  const emailResult = await sendProjectInvitationEmail({
    to: targetUser.email,
    inviterName: user.name,
    projectName: project.name,
    workspaceName: workspace.name,
    role: memberRole || ROLES.MEMBER,
    acceptUrl,
  });

  logger.info(`[invite] email result: ${JSON.stringify(emailResult)} → to=${targetUser.email}`);

  return { invited: true, email: targetUser.email };
};

/** Validates the token and adds the user to the project. */
const acceptProjectInvitation = async ({ token, user }) => {
  const invitation = await projectInvitationRepository.findPendingByTokenHash(hashToken(token));
  if (!invitation) throw ApiError.badRequest('Invitation is invalid or has already been used');
  if (invitation.expiresAt.getTime() < Date.now()) {
    invitation.status = INVITATION_STATUS.EXPIRED;
    await invitation.save();
    throw ApiError.badRequest('This invitation has expired');
  }
  if (String(invitation.user) !== String(user.id)) {
    throw ApiError.forbidden('This invitation was issued to a different account');
  }

  const { Project } = await import('../models/Project.js');
  const project = await Project.findById(invitation.project);
  if (!project) throw ApiError.notFound('Project no longer exists');

  if (!project.getMemberRole(user.id)) {
    project.members.push({ user: user.id, role: invitation.role });
    await project.save();
  }

  invitation.status = INVITATION_STATUS.ACCEPTED;
  invitation.acceptedAt = new Date();
  await invitation.save();

  await activityService.log({
    workspace: invitation.workspace,
    project: project.id,
    actor: user.id,
    action: ACTIVITY_ACTION.UPDATED,
    entityType: ENTITY_TYPE.PROJECT,
    entityId: project.id,
    message: `${user.name} joined the project`,
  });

  return projectRepository.findByIdPopulated(project.id);
};

const removeMember = async ({ project, role, targetUserId }) => {
  assertMinRole(role, ROLES.MANAGER);
  if (String(project.lead) === String(targetUserId)) {
    throw ApiError.badRequest('Reassign the project lead before removing them');
  }
  project.members = project.members.filter((m) => String(m.user) !== String(targetUserId));
  await project.save();
  return projectRepository.findByIdPopulated(project.id);
};

export const projectService = {
  create,
  list,
  getById,
  update,
  setArchived,
  remove,
  addMember,
  inviteMember,
  acceptProjectInvitation,
  removeMember,
};

export default projectService;
