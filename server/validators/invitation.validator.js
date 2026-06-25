import { body, param } from 'express-validator';

import { ROLE_VALUES } from '../constants/index.js';

export const inviteValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('role').optional().isIn(ROLE_VALUES),
  body('projectId').optional({ values: 'null' }).isMongoId(),
];

export const acceptInviteValidator = [
  body('token').isString().notEmpty().withMessage('Invitation token is required'),
];

export const invitationIdValidator = [param('id').isMongoId()];

export const respondInviteValidator = [
  param('id').isMongoId(),
  body('action').isIn(['accept', 'decline']).withMessage('Action must be accept or decline'),
];
