import { body, param } from 'express-validator';

import { ROLE_VALUES } from '../constants/index.js';

export const createProjectValidator = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('key')
    .optional()
    .trim()
    .matches(/^[A-Za-z0-9]{2,6}$/)
    .withMessage('Key must be 2–6 letters/numbers'),
  body('description').optional().isLength({ max: 1000 }),
  body('color').optional().isHexColor().withMessage('Color must be a hex value'),
  body('icon').optional().isString(),
  body('startDate').optional({ values: 'null' }).isISO8601().toDate(),
  body('dueDate').optional({ values: 'null' }).isISO8601().toDate(),
];

export const updateProjectValidator = [
  param('projectId').isMongoId(),
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().isLength({ max: 1000 }),
  body('color').optional().isHexColor(),
  body('icon').optional().isString(),
  body('startDate').optional({ values: 'null' }).isISO8601().toDate(),
  body('dueDate').optional({ values: 'null' }).isISO8601().toDate(),
];

export const projectIdValidator = [param('projectId').isMongoId()];

export const addMemberValidator = [
  param('projectId').isMongoId(),
  body('userId').isMongoId().withMessage('A valid userId is required'),
  body('role').optional().isIn(ROLE_VALUES),
];

export const memberIdValidator = [
  param('projectId').isMongoId(),
  param('userId').isMongoId(),
];

export const acceptProjectInviteValidator = [
  body('token').isString().notEmpty().withMessage('A valid invitation token is required'),
];
