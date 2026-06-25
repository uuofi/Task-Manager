import { body, param } from 'express-validator';

import {
  RECURRENCE_VALUES,
  TASK_PRIORITY_VALUES,
  TASK_STATUS_VALUES,
} from '../constants/index.js';

export const createTaskValidator = [
  body('projectId').isMongoId().withMessage('A valid projectId is required'),
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  body('description').optional().isLength({ max: 10000 }),
  body('status').optional().isIn(TASK_STATUS_VALUES),
  body('priority').optional().isIn(TASK_PRIORITY_VALUES),
  body('assignee').optional({ values: 'null' }).isMongoId(),
  body('reporter').optional().isMongoId(),
  body('tags').optional().isArray(),
  body('tags.*').optional().isString().trim(),
  body('estimatedHours').optional().isFloat({ min: 0 }),
  body('startDate').optional({ values: 'null' }).isISO8601().toDate(),
  body('dueDate').optional({ values: 'null' }).isISO8601().toDate(),
  body('dependencies').optional().isArray(),
  body('dependencies.*').optional().isMongoId(),
  body('recurrence.frequency').optional().isIn(RECURRENCE_VALUES),
  body('recurrence.interval').optional().isInt({ min: 1 }),
];

export const updateTaskValidator = [
  param('taskId').isMongoId(),
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 10000 }),
  body('status').optional().isIn(TASK_STATUS_VALUES),
  body('priority').optional().isIn(TASK_PRIORITY_VALUES),
  body('assignee').optional({ values: 'null' }).isMongoId(),
  body('tags').optional().isArray(),
  body('estimatedHours').optional().isFloat({ min: 0 }),
  body('startDate').optional({ values: 'null' }).isISO8601().toDate(),
  body('dueDate').optional({ values: 'null' }).isISO8601().toDate(),
  body('recurrence.frequency').optional().isIn(RECURRENCE_VALUES),
];

export const moveTaskValidator = [
  param('taskId').isMongoId(),
  body('status').optional().isIn(TASK_STATUS_VALUES),
  body('order').optional().isFloat(),
];

export const taskIdValidator = [param('taskId').isMongoId()];

export const checklistAddValidator = [
  param('taskId').isMongoId(),
  body('text').trim().isLength({ min: 1, max: 300 }).withMessage('Checklist text is required'),
];

export const checklistItemValidator = [
  param('taskId').isMongoId(),
  param('itemId').isMongoId(),
];

export const dependencyValidator = [
  param('taskId').isMongoId(),
  body('dependsOnId').isMongoId().withMessage('A valid dependsOnId is required'),
];
