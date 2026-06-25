import { ROLE_RANK } from '../constants/index.js';
import { workspaceRepository } from '../repositories/workspace.repository.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Resolves the target workspace id from the request (param, body, query, or
 * `x-workspace-id` header), loads the workspace, verifies the authenticated
 * user is a member, and attaches `req.workspace` + `req.membershipRole`.
 *
 * Must run after `authenticate`.
 */
export const loadWorkspace = asyncHandler(async (req, _res, next) => {
  const workspaceId =
    req.params.workspaceId ||
    req.body.workspaceId ||
    req.query.workspaceId ||
    req.headers['x-workspace-id'];

  if (!workspaceId) {
    throw ApiError.badRequest('Workspace context is required');
  }

  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) throw ApiError.notFound('Workspace not found');

  const role = workspace.getMemberRole(req.user.id);
  if (!role) throw ApiError.forbidden('You are not a member of this workspace');

  req.workspace = workspace;
  req.membershipRole = role;
  next();
});

/**
 * Role-based guard. Allows the request only if the caller's workspace role is
 * at least as privileged as ANY of the allowed roles (hierarchy-aware).
 *
 * Usage: `router.post('/', authenticate, loadWorkspace, authorize(ROLES.MANAGER), handler)`
 *
 * @param {...string} allowedRoles
 */
export const authorize = (...allowedRoles) =>
  asyncHandler(async (req, _res, next) => {
    const role = req.membershipRole;
    if (!role) {
      throw ApiError.forbidden('Workspace role could not be determined');
    }

    const minRequiredRank = Math.min(...allowedRoles.map((r) => ROLE_RANK[r] ?? Infinity));
    if ((ROLE_RANK[role] ?? 0) < minRequiredRank) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }
    next();
  });

export default authorize;
