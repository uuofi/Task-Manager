import { Router } from 'express';

import * as workspaceController from '../controllers/workspace.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { loadWorkspace } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  memberIdParamValidator,
  updateMemberPermissionsValidator,
  updateMemberRoleValidator,
  updateWorkspaceValidator,
} from '../validators/workspace.validator.js';

const router = Router();

router.use(authenticate);

// Not workspace-scoped: the user's workspace memberships.
router.get('/mine', workspaceController.listMyWorkspaces);

// Current workspace (via x-workspace-id header / query).
router.get('/current', loadWorkspace, workspaceController.getCurrentWorkspace);
router.patch(
  '/current',
  loadWorkspace,
  validate(updateWorkspaceValidator),
  workspaceController.updateWorkspace,
);
router.get('/current/members', loadWorkspace, workspaceController.listMembers);
router.patch(
  '/current/members/:userId/role',
  loadWorkspace,
  validate(updateMemberRoleValidator),
  workspaceController.updateMemberRole,
);
router.patch(
  '/current/members/:userId/permissions',
  loadWorkspace,
  validate(updateMemberPermissionsValidator),
  workspaceController.updateMemberPermissions,
);
router.delete(
  '/current/members/:userId',
  loadWorkspace,
  validate(memberIdParamValidator),
  workspaceController.removeMember,
);
router.post('/current/leave', loadWorkspace, workspaceController.leaveWorkspace);

export default router;
