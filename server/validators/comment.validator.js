import { body, param } from 'express-validator';

export const createCommentValidator = [
  param('taskId').isMongoId(),
  body('body').trim().isLength({ min: 1, max: 5000 }).withMessage('Comment cannot be empty'),
  body('parentId').optional({ values: 'null' }).isMongoId(),
  body('mentions').optional().isArray(),
  body('mentions.*').optional().isMongoId(),
  body('attachments').optional().isArray(),
  body('attachments.*').optional().isMongoId(),
];

export const updateCommentValidator = [
  param('commentId').isMongoId(),
  body('body').trim().isLength({ min: 1, max: 5000 }).withMessage('Comment cannot be empty'),
];

export const commentIdValidator = [param('commentId').isMongoId()];

export const reactValidator = [
  param('commentId').isMongoId(),
  body('emoji').isString().trim().isLength({ min: 1, max: 16 }).withMessage('Emoji is required'),
];
