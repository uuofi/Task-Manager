import { Router } from 'express';

import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import {
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
} from '../validators/auth.validator.js';

const router = Router();

// Public endpoints — protected by the stricter auth rate limiter.
router.post('/register', authLimiter, validate(registerValidator), authController.register);
router.post('/login', authLimiter, validate(loginValidator), authController.login);
router.post('/refresh', authController.refresh);
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordValidator),
  authController.forgotPassword,
);
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordValidator),
  authController.resetPassword,
);

// Authenticated endpoints.
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
