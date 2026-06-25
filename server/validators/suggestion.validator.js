import { body, param } from 'express-validator';

import { TASK_PRIORITY_VALUES } from '../constants/index.js';

export const createSuggestionValidator = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  body('suggestedTo').isMongoId().withMessage('A valid recipient is required'),
  body('description').optional().isLength({ max: 5000 }),
  body('priority').optional().isIn(TASK_PRIORITY_VALUES),
  body('projectId').optional({ values: 'null' }).isMongoId(),
  body('dueDate').optional({ values: 'null' }).isISO8601().toDate(),
];

export const acceptSuggestionValidator = [
  param('id').isMongoId(),
  body('projectId').optional({ values: 'null' }).isMongoId(),
];

export const rejectSuggestionValidator = [
  param('id').isMongoId(),
  body('note').optional().isLength({ max: 500 }),
];
