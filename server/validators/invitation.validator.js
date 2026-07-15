import { body, param } from 'express-validator';

import { MEMBER_PERMISSION_VALUES, ROLE_VALUES } from '../constants/index.js';

export const inviteValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('role').optional().isIn(ROLE_VALUES),
  body('projectId').optional({ values: 'null' }).isMongoId(),
  body('permissions').optional().isObject(),
  ...MEMBER_PERMISSION_VALUES.map((key) => body(`permissions.${key}`).optional().isBoolean()),
];

export const invitationIdValidator = [param('id').isMongoId()];

export const respondInviteValidator = [
  param('id').isMongoId(),
  body('action').isIn(['accept', 'decline']).withMessage('Action must be accept or decline'),
];
