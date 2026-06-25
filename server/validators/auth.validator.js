import { body } from 'express-validator';

const strongPassword = (field = 'password') =>
  body(field)
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number');

export const registerValidator = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  strongPassword(),
];

export const loginValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

export const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
];

export const resetPasswordValidator = [
  body('token').isString().notEmpty().withMessage('Reset token is required'),
  strongPassword(),
];
