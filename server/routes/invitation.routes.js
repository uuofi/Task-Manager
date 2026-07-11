import { Router } from 'express';

import * as invitationController from '../controllers/invitation.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { loadWorkspace } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  inviteValidator,
  invitationIdValidator,
  respondInviteValidator,
} from '../validators/invitation.validator.js';

const router = Router();

router.use(authenticate);

// Respond (accept/decline) to an invitation by ID — authenticated user only, no workspace context.
router.post('/:id/respond', validate(respondInviteValidator), invitationController.respondToInvitation);

// Workspace-scoped invitation management.
router.post('/', loadWorkspace, validate(inviteValidator), invitationController.createInvitation);
router.get('/', loadWorkspace, invitationController.listInvitations);
router.delete(
  '/:id',
  loadWorkspace,
  validate(invitationIdValidator),
  invitationController.revokeInvitation,
);

export default router;
