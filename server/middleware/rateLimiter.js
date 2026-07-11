import rateLimit from 'express-rate-limit';

import { env } from '../config/env.js';
import { HTTP_STATUS } from '../constants/index.js';

const handler = (req, res) => {
  res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
    success: false,
    message: 'Too many requests. Please slow down and try again later.',
  });
};

/** General API rate limiter applied to all routes. */
export const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

/**
 * Stricter limiter for authentication endpoints to mitigate brute-force and
 * credential-stuffing attacks.
 */
export const authLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts
  handler,
});

/** Limiter for the public contact form to deter spam/abuse. */
export const contactLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.contactMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export default apiLimiter;
