import { body } from 'express-validator';

export const contactValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 150 }),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 5000 })
    .withMessage('Message must be under 5000 characters'),
  // Hidden honeypot field — real users never fill it in; bots that autofill
  // every field do. No validation here on purpose: the controller silently
  // drops the submission instead of returning an error that would let bots
  // learn to avoid it.
  body('company').optional({ values: 'falsy' }).trim(),
];

export default contactValidator;
