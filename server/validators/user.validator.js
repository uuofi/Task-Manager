import { body } from 'express-validator';

export const updateProfileValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }),
  body('bio').optional().isLength({ max: 280 }),
  body('timezone').optional().isString(),
  body('notificationPrefs').optional().isObject(),
  body('notificationPrefs.*').optional().isBoolean(),
];

export const changePasswordValidator = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/)
    .withMessage('Add a lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Add an uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Add a number'),
];
