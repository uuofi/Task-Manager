import { body, param } from 'express-validator';

import { MEMBER_PERMISSION_VALUES, ROLE_VALUES } from '../constants/index.js';

export const updateWorkspaceValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }),
  body('description').optional().isLength({ max: 280 }),
  body('settings.theme').optional().isIn(['light', 'dark', 'system']),
];

export const updateMemberRoleValidator = [
  param('userId').isMongoId(),
  body('role').isIn(ROLE_VALUES).withMessage('A valid role is required'),
];

export const updateMemberPermissionsValidator = [
  param('userId').isMongoId(),
  ...MEMBER_PERMISSION_VALUES.map((key) => body(key).optional().isBoolean()),
];

export const memberIdParamValidator = [param('userId').isMongoId()];
