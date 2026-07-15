import { Router } from 'express';

import * as projectController from '../controllers/project.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { loadWorkspace } from '../middleware/authorize.js';
import { loadProject } from '../middleware/context.js';
import { validate } from '../middleware/validate.js';
import {
  acceptProjectInviteValidator,
  addMemberValidator,
  createProjectValidator,
  memberIdValidator,
  projectIdValidator,
  updateProjectValidator,
} from '../validators/project.validator.js';

const router = Router();

router.use(authenticate);

// Workspace-scoped (workspace id via `x-workspace-id` header, body, or query).
router.post('/', loadWorkspace, validate(createProjectValidator), projectController.createProject);
router.get('/', loadWorkspace, projectController.listProjects);

// Project-scoped (workspace derived from the project).
router.get('/:projectId', validate(projectIdValidator), loadProject(), projectController.getProject);
router.patch(
  '/:projectId',
  validate(updateProjectValidator),
  loadProject(),
  projectController.updateProject,
);
router.delete(
  '/:projectId',
  validate(projectIdValidator),
  loadProject(),
  projectController.deleteProject,
);

router.post(
  '/:projectId/archive',
  validate(projectIdValidator),
  loadProject(),
  projectController.archiveProject,
);
router.post(
  '/:projectId/restore',
  validate(projectIdValidator),
  loadProject(),
  projectController.restoreProject,
);

// Accept a project invitation (token-based, no project param needed).
router.post(
  '/invitations/accept',
  validate(acceptProjectInviteValidator),
  projectController.acceptProjectInvitation,
);

router.post(
  '/:projectId/members',
  validate(addMemberValidator),
  loadProject(),
  projectController.addProjectMember,
);
router.delete(
  '/:projectId/members/:userId',
  validate(memberIdValidator),
  loadProject(),
  projectController.removeProjectMember,
);
router.post(
  '/:projectId/leave',
  validate(projectIdValidator),
  loadProject(),
  projectController.leaveProject,
);

export default router;
