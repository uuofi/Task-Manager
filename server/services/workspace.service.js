import { MEMBER_PERMISSION_VALUES, ROLE_RANK, ROLES } from '../constants/index.js';
import { Workspace } from '../models/Workspace.js';
import { taskRepository } from '../repositories/task.repository.js';
import { workspaceRepository } from '../repositories/workspace.repository.js';
import { ApiError } from '../utils/ApiError.js';

const assertMinRole = (role, minRole) => {
  if ((ROLE_RANK[role] ?? 0) < ROLE_RANK[minRole]) {
    throw ApiError.forbidden('You do not have permission to perform this action');
  }
};

const getCurrent = (workspaceId) =>
  Workspace.findById(workspaceId).populate('members.user', 'name avatar email isOnline lastSeenAt');

const update = async ({ workspace, role, data }) => {
  assertMinRole(role, ROLES.ADMIN);
  if (data.name !== undefined) workspace.name = data.name;
  if (data.description !== undefined) workspace.description = data.description;
  if (data.settings?.theme) workspace.settings.theme = data.settings.theme;
  await workspace.save();
  return getCurrent(workspace.id);
};

/** Members enriched with per-user task statistics. */
const listMembers = async (workspace) => {
  const populated = await getCurrent(workspace.id);
  const stats = await taskRepository.assigneeStats(workspace.id);
  const statsById = stats.reduce((acc, s) => ({ ...acc, [String(s._id)]: s }), {});

  return populated.members.map((m) => {
    const u = m.user;
    const stat = statsById[String(u.id)] || { total: 0, completed: 0, overdue: 0 };
    return {
      user: u,
      role: m.role,
      permissions: m.permissions,
      joinedAt: m.joinedAt,
      stats: {
        totalTasks: stat.total,
        completedTasks: stat.completed,
        overdueTasks: stat.overdue,
        completionRate: stat.total ? Math.round((stat.completed / stat.total) * 100) : 0,
      },
    };
  });
};

const updateMemberRole = async ({ workspace, actorRole, targetUserId, newRole }) => {
  assertMinRole(actorRole, ROLES.ADMIN);
  if (String(workspace.owner) === String(targetUserId)) {
    throw ApiError.badRequest("The workspace owner's role cannot be changed");
  }
  const member = workspace.members.find((m) => String(m.user) === String(targetUserId));
  if (!member) throw ApiError.notFound('Member not found');
  if (newRole === ROLES.OWNER) throw ApiError.badRequest('Cannot assign the owner role');

  member.role = newRole;
  await workspace.save();
  return getCurrent(workspace.id);
};

/** Fine-grained capability toggles — only meaningful for plain `member`-rank users. */
const updateMemberPermissions = async ({ workspace, actorRole, targetUserId, permissions }) => {
  assertMinRole(actorRole, ROLES.ADMIN);
  const member = workspace.members.find((m) => String(m.user) === String(targetUserId));
  if (!member) throw ApiError.notFound('Member not found');
  if (member.role !== ROLES.MEMBER) {
    throw ApiError.badRequest('Only plain members have configurable permissions — managers and above already have full access');
  }

  for (const key of MEMBER_PERMISSION_VALUES) {
    if (typeof permissions?.[key] === 'boolean') member.permissions[key] = permissions[key];
  }
  await workspace.save();
  return getCurrent(workspace.id);
};

const removeMember = async ({ workspace, actorRole, targetUserId }) => {
  assertMinRole(actorRole, ROLES.ADMIN);
  if (String(workspace.owner) === String(targetUserId)) {
    throw ApiError.badRequest('The workspace owner cannot be removed');
  }
  workspace.members = workspace.members.filter((m) => String(m.user) !== String(targetUserId));
  await workspace.save();
  return { id: targetUserId };
};

const leave = async ({ workspace, user }) => {
  if (String(workspace.owner) === String(user.id)) {
    throw ApiError.badRequest('Transfer ownership before leaving the workspace');
  }
  workspace.members = workspace.members.filter((m) => String(m.user) !== String(user.id));
  await workspace.save();
  return { left: true };
};

const listForUser = (userId) => workspaceRepository.findByMember(userId);

export const workspaceService = {
  getCurrent,
  update,
  listMembers,
  updateMemberRole,
  updateMemberPermissions,
  removeMember,
  leave,
  listForUser,
};

export default workspaceService;
